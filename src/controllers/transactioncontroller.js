const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
exports.sendMoney = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { receiverId, amount, offline, upiPin } = req.body;
        // Validate receiver ID before querying MongoDB
if (
    typeof receiverId !== "string" ||
    !mongoose.Types.ObjectId.isValid(receiverId)
) {
    return res.status(400).json({
        success: false,
        message: "Invalid receiver ID"
    });
}
        const senderId = req.user_id;

        // 1. Strictly validate amount
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

// Maximum 2 decimal places
if (Math.round(numericAmount * 100) !== numericAmount * 100) {
    return res.status(400).json({
        success: false,
        message: "Amount can have at most 2 decimal places"
    });
}

// 2. Strictly validate offline flag
if (typeof offline !== "boolean") {
    return res.status(400).json({
        success: false,
        message: "offline must be a boolean"
    });
}

const isOffline = offline;

        // 3. Find sender
        const sender = await User.findById(senderId)
            .select("+upiPin");

        if (!sender) {
            return res.status(404).json({
                success: false,
                message: "Sender not found"
            });
        }

        // 4. Find receiver
        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        // 5. Prevent self-transfer
        if (sender._id.toString() === receiver._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot send money to yourself"
            });
        }

        // 6. Check UPI PIN
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

               // 7. Start the MongoDB transaction
        session.startTransaction();

        // 8. Create transaction record
        const newTransaction = new Transaction({
            sender: sender._id,
            receiver: receiver._id,
            amount: numericAmount,
            offline: isOffline,
            transactionId: crypto.randomUUID(),
            status: isOffline ? "PENDING" : "SUCCESS"
        });

        // 9. Atomically check available balance
        const senderBalanceFilter = {
            _id: sender._id,
            $expr: {
                $gte: [
                    {
                        $subtract: [
                            "$balance",
                            { $ifNull: ["$reservedBalance", 0] }
                        ]
                    },
                    numericAmount
                ]
            }
        };

        // 10. Offline payment: reserve funds
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

        // 11. Online payment: conditionally debit sender
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

        // 12. Credit receiver in the same transaction
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
            throw new Error("Receiver not found during payment");
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
            console.error("Transaction abort error:", abortError);
        }
    }

    console.error("Send money error:", error);

    // MongoDB write conflict / transient transaction error
    if (
        error.code === 112 ||
        error.codeName === "WriteConflict" ||
        error.hasErrorLabel?.("TransientTransactionError")
    ) {
        return res.status(409).json({
            success: false,
            message: "Transaction conflict. Please retry the payment."
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
} finally {
    await session.endSession();
}
}
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
        console.error("Get transactions error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.syncTransactions = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const userId = req.user_id;

        session.startTransaction();

        const pending = await Transaction.find({
            sender: userId,
            offline: true,
            status: "PENDING"
        }).session(session);

        for (const tx of pending) {
            const sender = await User.findById(tx.sender).session(session);
            const receiver = await User.findById(tx.receiver).session(session);

            if (!sender || !receiver) {
                tx.status = "FAILED";

                if (sender) {
                    sender.reservedBalance =
                        Math.max(
                            0,
                            (sender.reservedBalance || 0) - tx.amount
                        );

                    await sender.save({ session });
                }

                await tx.save({ session });

                continue;
            }

            const reservedBalance = sender.reservedBalance || 0;

           // Make sure this transaction has a reservation
if (reservedBalance < tx.amount) {
    tx.status = "FAILED";
    await tx.save({ session });
    continue;
}

            // Convert reservation into actual payment
            sender.balance -= tx.amount;
            sender.reservedBalance -= tx.amount;

            receiver.balance += tx.amount;

            await sender.save({ session });
            await receiver.save({ session });
            tx.status = "SUCCESS";
            tx.syncedAt = new Date();

            await tx.save({ session });
        }

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Transactions synced successfully"
        });

        } catch (error) {
        if (session.inTransaction()) {
            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error("Sync transaction abort error:", abortError);
            }
        }

        console.error("Sync transactions error:", error);

        return res.status(500).json({
            success: false,
            message: "Transaction sync failed"
        });

    } finally {
        await session.endSession();
    }
};
