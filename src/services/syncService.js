const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const ReplayPacket = require("../models/ReplayPacket");
const User = require("../models/User");
const offlineQueue = require("../mesh/offlineQueue");
const { verifyPacket } = require("./verifyPacket");
const SECRET = process.env.PACKET_SECRET || "offline-upi-secret";
async function syncQueue() {
    const items = offlineQueue.getAll();
    if (items.length === 0) {
        return {
            success: true,
            message: "No packets to sync",
            synced: 0,
            failed: 0
        };
    }
    let synced = 0;
    let failed = 0;
    const itemsToSync = [...items];
    for (const item of itemsToSync) {
        const packet = item.packet || item;
        let session;
        let transactionStarted = false;
        try {
            if (!packet || !packet.packetId) {
                failed++;
                continue;
            }

            offlineQueue.updateStatus(
                packet.packetId,
                "SYNCING"
            );


            // 1. Verify packet
            const verification = verifyPacket(
                packet,
                SECRET
            );

            if (!verification.valid) {

                offlineQueue.updateStatus(
                    packet.packetId,
                    "FAILED"
                );

                failed++;
                continue;
            }


            // 2. Start MongoDB transaction
            session = await mongoose.startSession();

            session.startTransaction();

            transactionStarted = true;


            // 3. Check whether this packet was already processed
            const processedPacket = await ReplayPacket.findOne({
                packetId: packet.packetId
            }).session(session);

            if (processedPacket) {
                throw new Error(
                    "Packet has already been processed"
                );
            }


            // 4. Check duplicate transaction / packet
            const existing = await Transaction.findOne({

                $or: [

                    {
                        transactionId: packet.txnId
                    },

                    {
                        packetId: packet.packetId
                    }

                ]

            }).session(session);


            if (existing) {

                throw new Error(
                    "Transaction or packet already settled"
                );
            }


            // 5. Find sender
            const sender = await User.findById(
                packet.sender
            ).session(session);


            // 6. Find receiver
            const receiver = await User.findById(
                packet.receiver
            ).session(session);


            if (!sender || !receiver) {

                throw new Error(
                    "Sender or receiver not found"
                );
            }


            // Sender cannot pay himself
            if (
                sender._id.toString() ===
                receiver._id.toString()
            ) {

                throw new Error(
                    "Sender and receiver cannot be the same"
                );
            }


            // 7. Validate amount again on server
            const amount = Number(packet.amount);

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                throw new Error(
                    "Invalid amount"
                );
            }
            // 8. Balance check
            if (sender.balance < amount) {

                throw new Error(
                    "Insufficient balance"
                );
            }
            // 9. Update balances
            sender.balance -= amount;
            receiver.balance += amount;

            await sender.save({ session });
            await receiver.save({ session });


            // 10. Save transaction
            await Transaction.create(
                [
                    {
                        sender: sender._id,
                        receiver: receiver._id,
                        amount,

                        transactionId:
                            packet.txnId,

                        packetId:
                            packet.packetId,

                        nonce:
                            packet.nonce,

                        signature:
                            packet.signature,

                        packetTimestamp:
                            packet.timestamp,

                        offline: true,

                        status: "SYNCED",

                        syncedAt: new Date()
                    }
                ],
                {
                    session
                }
            );


            // 11. Mark packet as processed
            // This is inside the SAME MongoDB transaction.
            await ReplayPacket.create(
                [
                    {
                        packetId:
                            packet.packetId,

                        txnId:
                            packet.txnId,

                        nonce:
                            packet.nonce,

                        processedAt:
                            new Date(),

                        expiresAt:
                            new Date(packet.expiresAt)
                    }
                ],
                {
                    session
                }
            );
            // 12. Commit everything
            await session.commitTransaction();
            transactionStarted = false;
            // 13. Remove successfully synced packet
            offlineQueue.remove(
                packet.packetId
            );

            synced++;
        } catch (error) {

            console.error(
                `Failed to sync packet ${packet?.packetId}:`,
                error.message
            );
            if (
                session &&
                transactionStarted
            ) {

                try {

                    await session.abortTransaction();

                } catch (abortError) {

                    console.error(
                        "Transaction abort failed:",
                        abortError.message
                    );
                }
            }
            if (packet?.packetId) {

                offlineQueue.updateStatus(
                    packet.packetId,
                    "FAILED"
                );
            }

            failed++;
        } finally {

            if (session) {

                await session.endSession();
            }
        }
    }
    return {
        success: failed === 0,
        message:
            `${synced} packet(s) synced, ` +
            `${failed} failed.`,

        synced,
        failed
    };
}
module.exports = {
    syncQueue
};