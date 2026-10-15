const mongoose = require("mongoose");
require("dotenv").config();

const Transaction = require("../models/Transaction");
const ReplayPacket = require("../models/ReplayPacket");

const MONGODB_URI = process.env.MONGODB_URI;

async function checkRecords() {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log("MongoDB Connected:", mongoose.connection.host);
        console.log("Database:", mongoose.connection.name);

        const txnId = "issue6-txn-001";

        console.log("\n===== TRANSACTION RECORDS =====");

        const transactions = await Transaction.find({
            transactionId: txnId
        }).lean();

        console.log(
            JSON.stringify(transactions, null, 2)
        );

        console.log(
            "\nTransaction count:",
            transactions.length
        );

        console.log("\n===== REPLAY PACKET RECORDS =====");

        const replayPackets = await ReplayPacket.find({
            txnId: txnId
        }).lean();

        console.log(
            JSON.stringify(replayPackets, null, 2)
        );

        console.log(
            "\nReplayPacket count:",
            replayPackets.length
        );

        console.log("\n===== SUMMARY =====");

        console.log(
            "Transaction exists:",
            transactions.length > 0
        );

        console.log(
            "ReplayPacket exists:",
            replayPackets.length > 0
        );

        if (transactions.length > 0) {
            console.log(
                "\nTransaction packetId:",
                transactions[0].packetId
            );
        }

        if (replayPackets.length > 0) {
            console.log(
                "ReplayPacket packetId:",
                replayPackets[0].packetId
            );
        }

    } catch (error) {
        console.error(
            "\nERROR:",
            error.message
        );
    } finally {
        await mongoose.disconnect();
        console.log("\nMongoDB disconnected.");
    }
}

checkRecords();