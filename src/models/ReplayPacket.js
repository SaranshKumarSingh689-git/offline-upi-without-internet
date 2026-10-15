const mongoose = require("mongoose");
const replayPacketSchema = new mongoose.Schema(
    {
        packetId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        txnId: {
            type: String,
            required: true
        },

        nonce: {
            type: String,
            required: true
        },

        processedAt: {
            type: Date,
            default: Date.now
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Automatically delete replay records after expiry
replayPacketSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports =
    mongoose.models.ReplayPacket ||
    mongoose.model("ReplayPacket", replayPacketSchema);