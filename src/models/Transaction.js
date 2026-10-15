const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 1
        },
        status: {
            type: String,
            enum: [
                "SUCCESS",
                "FAILED",
                "PENDING",
                "QUEUED",
                "SYNCING",
                "SYNCED"
            ],
            default: "PENDING"
        },
        offline: {
            type: Boolean,
            default: false
        },
        // Normal + offline transaction ID
        transactionId: {
            type: String,
            required: true,
            unique: true
        },
        // Offline packet information
        packetId: {
            type: String,
            unique: true,
            sparse: true
        },
        nonce: {
            type: String,
            sparse: true
        },
        signature: {
            type: String
        },
        packetTimestamp: {
            type: Date
        },
        syncedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);
// Faster transaction history queries
transactionSchema.index({
    sender: 1,
    createdAt: -1
});
transactionSchema.index({
    receiver: 1,
    createdAt: -1
});
transactionSchema.index({
    status: 1
});
module.exports = mongoose.model(
    "Transaction",
    transactionSchema
);