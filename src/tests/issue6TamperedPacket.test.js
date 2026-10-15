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

    // ==========================================
    // 1. Create legitimate ₹100 packet
    // ==========================================

    const packet = createPacket({
        sender: SENDER_ID,
        receiver: RECEIVER_ID,
        amount: 100,
        txnId: "issue6-tampered-" + Date.now()
    });

    // ==========================================
    // 2. Sign the legitimate packet
    // ==========================================

    const signedPacket = signPacket(
        packet,
        SECRET
    );

    console.log("\n===== ORIGINAL SIGNED PACKET =====\n");

    console.log(
        JSON.stringify(
            signedPacket,
            null,
            2
        )
    );

    // ==========================================
    // 3. TAMPER AFTER SIGNING
    // ==========================================

    console.log(
        "\n===== TAMPERING PACKET =====\n"
    );

    console.log(
        "Original amount:",
        signedPacket.amount
    );

    // Attacker changes ₹100 → ₹500
    // Signature is NOT regenerated.
    signedPacket.amount = 500;

    console.log(
        "Tampered amount:",
        signedPacket.amount
    );

    console.log(
        "\nSignature remains:",
        signedPacket.signature
    );

    // ==========================================
    // 4. Queue tampered packet
    // ==========================================

    offlineQueue.add(signedPacket);

    console.log(
        "\n===== QUEUE =====\n"
    );

    console.log(
        offlineQueue.getAll()
    );

    // ==========================================
    // 5. Attempt sync
    // ==========================================

    console.log(
        "\n===== STARTING TAMPERED PACKET SYNC =====\n"
    );

    const result = await syncQueue();

    console.log(
        "\n===== SYNC RESULT =====\n"
    );

    console.log(result);

    // ==========================================
    // 6. Check transaction
    // ==========================================

    const transactions =
        await Transaction.find({
            packetId: signedPacket.packetId
        }).lean();

    console.log(
        "\n===== TRANSACTION CHECK =====\n"
    );

    console.log(
        JSON.stringify(
            transactions,
            null,
            2
        )
    );

    console.log(
        "\nTransaction count:",
        transactions.length
    );

    // ==========================================
    // 7. Check ReplayPacket
    // ==========================================

    const replayRecord =
        await ReplayPacket.findOne({
            packetId: signedPacket.packetId
        }).lean();

    console.log(
        "\n===== REPLAY PACKET CHECK =====\n"
    );

    console.log(
        JSON.stringify(
            replayRecord,
            null,
            2
        )
    );

    // ==========================================
    // 8. Final result
    // ==========================================

    console.log(
        "\n================================"
    );

    console.log(
        "TAMPERED PACKET TEST RESULT"
    );

    console.log(
        "================================\n"
    );

    const syncRejected =
        result.synced === 0 &&
        result.failed === 1;

    const noTransaction =
        transactions.length === 0;

    const noReplayRecord =
        replayRecord === null;

    if (
        syncRejected &&
        noTransaction &&
        noReplayRecord
    ) {
        console.log(
            "✅ TEST PASSED"
        );

        console.log(
            "Tampered amount was rejected."
        );

        console.log(
            "Original signature could not authorize modified data."
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
        console.log(
            "syncRejected:",
            syncRejected
        );
        console.log(
            "noTransaction:",
            noTransaction
        );
        console.log(
            "noReplayRecord:",
            noReplayRecord
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