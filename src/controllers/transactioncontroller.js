const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const ReplayPacket = require("../models/ReplayPacket");

const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const createPacket = require("../utils/createPacket");
const signPacket = require("../services/signPacket");
const { verifyPacket } = require("../services/verifyPacket");

// Never fall back to a hard-coded signing secret.
function getPacketSecret() {
    const secret = process.env.PACKET_SECRET;

    if (!secret || typeof secret !== "string") {
        throw new Error("PACKET_SECRET is not configured");
    }

    return secret;
}


// ======================================================
// SEND MONEY
// ======================================================

exports.sendMoney = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { receiverId, amount, offline, upiPin } = req.body;
        const senderId = req.user_id;

        // Validate receiver ID
        if (
            typeof receiverId !== "string" ||
            !mongoose.Types.ObjectId.isValid(receiverId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiver ID"
            });
        }

        // Validate amount
        const numericAmount = Number(amount);

        if (
            amount === null ||
            amount === undefined ||
            amount === "" ||
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        if (
            Math.round(numericAmount * 100) !==
            numericAmount * 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Amount can have at most 2 decimal places"
            });
        }

        if (typeof offline !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "offline must be a boolean"
            });
        }

        const isOffline = offline;

        // Find sender
        const sender = await User.findById(senderId)
            .select("+upiPin");

        if (!sender) {
            return res.status(404).json({
                success: false,
                message: "Sender not found"
            });
        }

        // Find receiver
        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        // Prevent self-transfer
        if (
            sender._id.toString() ===
            receiver._id.toString()
        ) {
            return res.status(400).json({
                success: false,
                message: "You cannot send money to yourself"
            });
        }

        // Verify UPI PIN
        if (!sender.upiPin) {
            return res.status(400).json({
                success: false,
                message: "UPI PIN is not set"
            });
        }

        if (!upiPin) {
            return res.status(400).json({
                success: false,
                message: "UPI PIN is required"
            });
        }

        const pinValid = await bcrypt.compare(
            String(upiPin),
            sender.upiPin
        );

        if (!pinValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid UPI PIN"
            });
        }

        // Generate the actual transaction ID first.
        const transactionId = crypto.randomUUID();

        // Create and sign packet only for offline payments.
        let signedPacket = null;

        if (isOffline) {
            const secret = getPacketSecret();

            const packet = createPacket({
                sender: sender._id.toString(),
                receiver: receiver._id.toString(),
                amount: numericAmount,
                txnId: transactionId
            });

            signedPacket = signPacket(packet, secret);
        }

        session.startTransaction();

        // Create transaction
        const transactionFields = {
            sender: sender._id,
            receiver: receiver._id,
            amount: numericAmount,
            offline: isOffline,
            transactionId,
            status: isOffline ? "PENDING" : "SUCCESS"
        };

        if (signedPacket) {
            transactionFields.packetId =
                signedPacket.packetId;

            transactionFields.nonce =
                signedPacket.nonce;

            transactionFields.signature =
                signedPacket.signature;

            transactionFields.packetTimestamp =
                new Date(signedPacket.timestamp);

            transactionFields.packetData =
                signedPacket;
        }

        const newTransaction = new Transaction(
            transactionFields
        );

        // Check available balance:
        // available balance = balance - reservedBalance
        const senderBalanceFilter = {
            _id: sender._id,
            $expr: {
                $gte: [
                    {
                        $subtract: [
                            "$balance",
                            {
                                $ifNull: [
                                    "$reservedBalance",
                                    0
                                ]
                            }
                        ]
                    },
                    numericAmount
                ]
            }
        };

        // Offline payment: reserve balance.
        if (isOffline) {
            const reservation = await User.updateOne(
                senderBalanceFilter,
                {
                    $inc: {
                        reservedBalance: numericAmount
                    }
                },
                { session }
            );

            if (reservation.matchedCount === 0) {
                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message: "Insufficient available balance"
                });
            }

            await newTransaction.save({ session });

            await session.commitTransaction();

            return res.status(201).json({
                success: true,
                message: "Offline transaction queued",
                transaction: newTransaction
            });
        }

        // Online payment: debit sender.
        const debit = await User.updateOne(
            senderBalanceFilter,
            {
                $inc: {
                    balance: -numericAmount
                }
            },
            { session }
        );

        if (debit.matchedCount === 0) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Insufficient available balance"
            });
        }

        // Credit receiver.
        const credit = await User.updateOne(
            { _id: receiver._id },
            {
                $inc: {
                    balance: numericAmount
                }
            },
            { session }
        );

        if (credit.matchedCount === 0) {
            throw new Error(
                "Receiver not found during payment"
            );
        }

        await newTransaction.save({ session });

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: "Transaction successful",
            transaction: newTransaction
        });

    } catch (error) {
        if (session.inTransaction()) {
            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error(
                    "Transaction abort error:",
                    abortError
                );
            }
        }

        console.error("Send money error:", error);

        if (
            error.code === 112 ||
            error.codeName === "WriteConflict" ||
            error.hasErrorLabel?.(
                "TransientTransactionError"
            )
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Transaction conflict. Please retry the payment."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    } finally {
        await session.endSession();
    }
};


// ======================================================
// TRANSACTION HISTORY
// ======================================================

exports.getTransactions = async (req, res) => {
    try {
        const userId = req.user_id;

        const transactions = await Transaction.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        })
            .populate("sender", "fullName upiId")
            .populate("receiver", "fullName upiId")
            .sort({ createdAt: -1 })
            .limit(10);

        return res.status(200).json({
            success: true,
            transactions
        });

    } catch (error) {
        console.error(
            "Get transactions error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// ======================================================
// SYNC OFFLINE TRANSACTIONS
// ======================================================

exports.syncTransactions = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const userId = req.user_id;
        const secret = getPacketSecret();

        session.startTransaction();

        const pending = await Transaction.find({
            sender: userId,
            offline: true,
            status: "PENDING"
        }).session(session);

        let synced = 0;
        let failed = 0;

        for (const tx of pending) {
            const sender = await User.findById(
                tx.sender
            ).session(session);

            const receiver = await User.findById(
                tx.receiver
            ).session(session);

            // Release reservation for a failed transaction
            // only if the aggregate reservation can cover it.
            const releaseReservation = async () => {
                if (!sender) {
                    return;
                }

                const reserved = Number(
                    sender.reservedBalance || 0
                );

                if (reserved >= tx.amount) {
                    sender.reservedBalance =
                        reserved - tx.amount;

                    await sender.save({ session });
                }
            };

            if (!sender || !receiver) {
                await releaseReservation();

                tx.status = "FAILED";
                await tx.save({ session });

                failed++;
                continue;
            }

            const packet = tx.packetData;

            // Old transactions without a signed packet
            // cannot pass the new verification process.
            if (!packet) {
                await releaseReservation();

                tx.status = "FAILED";
                await tx.save({ session });

                failed++;
                continue;
            }

            // 1. Verify HMAC signature, timestamp and expiry.
            const verification = verifyPacket(
                packet,
                secret
            );

            // 2. Ensure packet values match the database record.
            const packetMatchesTransaction =
                packet.txnId === tx.transactionId &&
                packet.packetId === tx.packetId &&
                packet.nonce === tx.nonce &&
                packet.signature === tx.signature &&
                String(packet.sender) ===
                    tx.sender.toString() &&
                String(packet.receiver) ===
                    tx.receiver.toString() &&
                Number(packet.amount) ===
                    Number(tx.amount) &&
                Number.isFinite(packet.timestamp) &&
                tx.packetTimestamp &&
                new Date(packet.timestamp).getTime() ===
                    tx.packetTimestamp.getTime();

            if (
                !verification.valid ||
                !packetMatchesTransaction
            ) {
                await releaseReservation();

                tx.status = "FAILED";
                await tx.save({ session });

                failed++;
                continue;
            }

            // 3. Check if this packet was already processed.
            const alreadyProcessed =
                await ReplayPacket.findOne({
                    packetId: packet.packetId
                }).session(session);

            if (alreadyProcessed) {
                await releaseReservation();

                tx.status = "FAILED";
                await tx.save({ session });

                failed++;
                continue;
            }

            // 4. Check the reserved balance.
            const reservedBalance = Number(
                sender.reservedBalance || 0
            );

            if (reservedBalance < tx.amount) {
                tx.status = "FAILED";
                await tx.save({ session });

                failed++;
                continue;
            }

            // 5. Insert replay record in the SAME transaction.
            // ReplayPacket.packetId must have a unique index.
            await ReplayPacket.create(
                [
                    {
                        packetId: packet.packetId,
                        txnId: packet.txnId,
                        nonce: packet.nonce,
                        processedAt: new Date(),
                        expiresAt: new Date(
                            packet.expiresAt
                        )
                    }
                ],
                { session }
            );

            // 6. Settle payment using existing reservation logic.
            sender.balance -= tx.amount;

            sender.reservedBalance =
                reservedBalance - tx.amount;

            receiver.balance += tx.amount;

            await sender.save({ session });
            await receiver.save({ session });

            tx.status = "SUCCESS";
            tx.syncedAt = new Date();

            await tx.save({ session });

            synced++;
        }

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Transactions synced successfully",
            synced,
            failed
        });

    } catch (error) {
        if (session.inTransaction()) {
            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error(
                    "Sync transaction abort error:",
                    abortError
                );
            }
        }

        console.error(
            "Sync transactions error:",
            error
        );

        // Concurrent requests may compete to insert the
        // same packet ID. Abort prevents partial settlement.
        if (
            error.code === 11000 ||
            error.code === 112 ||
            error.codeName === "WriteConflict" ||
            error.hasErrorLabel?.(
                "TransientTransactionError"
            )
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Sync conflict detected. Retry sync."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Transaction sync failed"
        });

    } finally {
        await session.endSession();
    }
};

