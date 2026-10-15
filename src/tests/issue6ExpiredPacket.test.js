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

    // 1. Create a normal packet
    const packet = createPacket({
        sender: SENDER_ID,
        receiver: RECEIVER_ID,
        amount: 100,
        txnId: "issue6-expired-" + Date.now()
    });

    // 2. Force the packet to be expired
    packet.timestamp = Date.now() - (6 * 60 * 1000);

    packet.expiresAt =
        packet.timestamp + (5 * 60 * 1000);

    // At this point:
    // timestamp = 6 minutes ago
    // expiresAt = 1 minute ago
    //
    // Therefore the packet is definitely expired.

    // 3. Sign the modified packet
    const signedPacket = signPacket(
        packet,
        SECRET
    );

    console.log("\n===== EXPIRED SIGNED PACKET =====\n");

    console.log(
        JSON.stringify(
            signedPacket,
            null,
            2
        )
    );

    console.log("\nCurrent time:");
    console.log(new Date().toISOString());

    console.log("\nPacket timestamp:");
    console.log(
        new Date(signedPacket.timestamp).toISOString()
    );

    console.log("\nPacket expiresAt:");
    console.log(
        new Date(signedPacket.expiresAt).toISOString()
    );


    // 4. Add expired packet to queue

    offlineQueue.add(signedPacket);

    console.log("\n===== QUEUE =====\n");

    console.log(
        offlineQueue.getAll()
    );


    // 5. Attempt synchronization

    console.log("\n===== STARTING EXPIRED PACKET SYNC =====\n");

    const result = await syncQueue();


    // 6. Sync result

    console.log("\n===== SYNC RESULT =====\n");

    console.log(result);


    // 7. Check transaction

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


    // 8. Check ReplayPacket

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


    // 9. Final result

    console.log(
        "\n================================"
    );

    console.log(
        "EXPIRED PACKET TEST RESULT"
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
            "Expired packet was rejected."
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