require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const createPacket = require("../utils/createPacket");
const signPacket = require("../services/signPacket");
const offlineQueue = require("../mesh/offlineQueue");
const ReplayPacket = require("../models/ReplayPacket");
const Transaction = require("../models/Transaction");
const { syncQueue } = require("../services/syncService");

const SENDER_ID = "6ac18c6cd476bc649a4e4745";
const RECEIVER_ID = "6ac18c91d476bc649a4e4746";

const SECRET =
    process.env.PACKET_SECRET || "offline-upi-secret";

async function runTest() {
    await connectDB();

    await ReplayPacket.init();

    // Recent timestamp, but expiry is already in the past.
    const now = Date.now();

    const packet = createPacket({
        sender: SENDER_ID,
        receiver: RECEIVER_ID,
        amount: 100,
        txnId: "issue6-expiry-branch-" + now
    });

    packet.timestamp = now;

    // Expired BEFORE the packet is synced.
    packet.expiresAt = now - 1000;

    // Sign AFTER modifying the packet.
    const signedPacket = signPacket(
        packet,
        SECRET
    );

    console.log("\n===== EXPLICIT EXPIRY PACKET =====\n");

    console.log(
        JSON.stringify(
            signedPacket,
            null,
            2
        )
    );

    console.log(
        "\nCurrent time:",
        new Date().toISOString()
    );

    console.log(
        "Packet timestamp:",
        new Date(
            signedPacket.timestamp
        ).toISOString()
    );

    console.log(
        "Packet expiresAt:",
        new Date(
            signedPacket.expiresAt
        ).toISOString()
    );

    // Queue packet
    offlineQueue.add(signedPacket);

    // Sync
    console.log(
        "\n===== STARTING SYNC =====\n"
    );

    const result = await syncQueue();

    console.log(
        "\n===== SYNC RESULT =====\n"
    );

    console.log(result);

    // Check transaction
    const transactions =
        await Transaction.find({
            packetId: signedPacket.packetId
        }).lean();
    console.log(
        "\nTransaction count:",
        transactions.length
    );
    // Check replay record
    const replayRecord =
        await ReplayPacket.findOne({
            packetId: signedPacket.packetId
        }).lean();
    console.log(
        "ReplayPacket:",
        replayRecord
    );
    // Final result
    const rejected =
        result.synced === 0 &&
        result.failed === 1;

    const noTransaction =
        transactions.length === 0;

    const noReplay =
        replayRecord === null;

    console.log(
        "\n================================"
    );
    console.log(
        "EXPLICIT EXPIRY TEST RESULT"
    );

    console.log(
        "================================\n"
    );
    if (
        rejected &&
        noTransaction &&
        noReplay
    ) {
        console.log(
            "✅ TEST PASSED"
        );

        console.log(
            "Packet expired branch rejected the packet."
        );

        console.log(
            "No transaction was created."
        );

        console.log(
            "No ReplayPacket was created."
        );
    } else {
        console.log(
            "❌ TEST FAILED"
        );
    }
    await mongoose.connection.close();
}
runTest().catch((error) => {
    console.error(
        "\nTEST FAILED:\n",
        error
    );
    process.exit(1);
});