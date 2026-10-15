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

    // 1. Connect to MongoDB
    await connectDB();

    await ReplayPacket.init();

    // 2. Create ONE packet
    const packet = createPacket({
        sender: SENDER_ID,
        receiver: RECEIVER_ID,
        amount: 100,
        txnId: "issue6-replay-test-" + Date.now()
    });

    // 3. Sign packet ONCE
    const signedPacket = signPacket(
        packet,
        SECRET
    );

    console.log("\n===== SIGNED PACKET =====\n");

    console.log(
        JSON.stringify(
            signedPacket,
            null,
            2
        )
    );


    // =====================================================
    // FIRST SYNC
    // =====================================================

    console.log("\n================================");
    console.log("FIRST SYNC");
    console.log("================================\n");

    // Add packet
    offlineQueue.add(signedPacket);

    console.log("Queue before first sync:");
    console.log(
        offlineQueue.getAll()
    );

    // Sync
    const firstResult = await syncQueue();

    console.log("\n===== FIRST SYNC RESULT =====\n");

    console.log(firstResult);


    // =====================================================
    // CHECK REPLAY RECORD IMMEDIATELY
    // =====================================================

    const replayAfterFirstSync =
        await ReplayPacket.findOne({
            packetId: signedPacket.packetId
        }).lean();

    console.log(
        "\n===== REPLAY RECORD AFTER FIRST SYNC =====\n"
    );

    console.log(
        JSON.stringify(
            replayAfterFirstSync,
            null,
            2
        )
    );


    // =====================================================
    // SECOND SYNC — EXACT SAME PACKET
    // =====================================================

    console.log("\n================================");
    console.log("SECOND SYNC — REPLAY ATTEMPT");
    console.log("================================\n");

    // IMPORTANT:
    // We add THE EXACT SAME signedPacket again.
    // No new packet.
    // No new nonce.
    // No new signature.

    offlineQueue.add(signedPacket);

    console.log("Queue before replay:");
    console.log(
        offlineQueue.getAll()
    );

    const secondResult = await syncQueue();

    console.log("\n===== SECOND SYNC RESULT =====\n");

    console.log(secondResult);


    // =====================================================
    // CHECK REPLAY RECORD AGAIN
    // =====================================================

    const replayAfterSecondSync =
        await ReplayPacket.findOne({
            packetId: signedPacket.packetId
        }).lean();

    console.log(
        "\n===== REPLAY RECORD AFTER SECOND SYNC =====\n"
    );

    console.log(
        JSON.stringify(
            replayAfterSecondSync,
            null,
            2
        )
    );


    // =====================================================
    // CHECK TRANSACTION COUNT
    // =====================================================

    const transactions =
        await Transaction.find({
            packetId: signedPacket.packetId
        }).lean();

    console.log(
        "\n===== TRANSACTIONS FOR THIS PACKET =====\n"
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


    // =====================================================
    // FINAL TEST RESULT
    // =====================================================

    console.log("\n================================");
    console.log("REPLAY PROTECTION TEST RESULT");
    console.log("================================\n");

    const firstPassed =
        firstResult.synced === 1 &&
        firstResult.failed === 0;

    const secondPassed =
        secondResult.synced === 0 &&
        secondResult.failed === 1;

    const replayBlocked =
        replayAfterFirstSync !== null;

    const onlyOneTransaction =
        transactions.length === 1;

    if (
        firstPassed &&
        secondPassed &&
        replayBlocked &&
        onlyOneTransaction
    ) {

        console.log(
            "✅ TEST PASSED"
        );

        console.log(
            "First sync succeeded."
        );

        console.log(
            "Second identical packet was rejected."
        );

        console.log(
            "ReplayPacket blocked the replay."
        );

        console.log(
            "Only one transaction was created."
        );

    } else {

        console.log(
            "❌ TEST FAILED"
        );

        console.log(
            "firstPassed:",
            firstPassed
        );

        console.log(
            "secondPassed:",
            secondPassed
        );

        console.log(
            "replayBlocked:",
            replayBlocked
        );

        console.log(
            "onlyOneTransaction:",
            onlyOneTransaction
        );
    }


    // 8. Close MongoDB
    await mongoose.connection.close();
}


runTest().catch((error) => {

    console.error(
        "\nTEST FAILED:\n",
        error
    );

    process.exit(1);
});