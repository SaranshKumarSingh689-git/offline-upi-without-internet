require("dotenv").config();

const mongoose = require("mongoose");
const ReplayPacket = require("../models/ReplayPacket");

async function debugReplayModel() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("===== REPLAY MODEL DEBUG =====");

        console.log(
            "Model name:",
            ReplayPacket.modelName
        );

        console.log(
            "Collection name:",
            ReplayPacket.collection.name
        );

        console.log(
            "Database:",
            mongoose.connection.name
        );

        console.log(
            "Host:",
            mongoose.connection.host
        );

        console.log(
            "\n===== SCHEMA PATHS ====="
        );

        console.log(
            Object.keys(ReplayPacket.schema.paths)
        );

        console.log(
            "\n===== INDEXES ====="
        );

        console.log(
            await ReplayPacket.collection.indexes()
        );

        console.log(
            "\n===== ALL REPLAY PACKETS ====="
        );

        const packets = await ReplayPacket.find({}).lean();

        console.log(
            JSON.stringify(packets, null, 2)
        );

    } catch (error) {
        console.error(
            "ERROR:",
            error
        );
    } finally {
        await mongoose.disconnect();
    }
}

debugReplayModel();