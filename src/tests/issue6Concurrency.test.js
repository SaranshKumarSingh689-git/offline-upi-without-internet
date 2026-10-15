require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const createPacket = require("../utils/createPacket");
const signPacket = require("../services/signPacket");
const offlineQueue = require("../mesh/offlineQueue");

const ReplayPacket = require("../models/ReplayPacket");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const { syncQueue } = require("../services/syncService");

const SENDER_ID = "6ac18c6cd476bc649a4e4745";
const RECEIVER_ID = "6ac18c91d476bc649a4e4746";

const SECRET =
    process.env.PACKET_SECRET || "offline-upi-secret";

async function runTest() {
   await connectDB();

// Initialize collections and indexes before concurrent operations.
// This avoids first-use collection creation racing with the test.
await Promise.all([
    User.init(),
    Transaction.init(),
    ReplayPacket.init()
]);

console.log("MongoDB collections and indexes initialized.");

    console.log("\n================================");
    console.log("ISSUE #6 CONCURRENCY TEST");
    console.log("================================\n");

    /*
     * Create a fresh packet.
     */
    const packet = createPacket({
        sender: SENDER_ID,
        receiver: RECEIVER_ID,
        amount: 100,
        txnId: "issue6-concurrency-" + Date.now()
    });

    const signedPacket = signPacket(packet, SECRET);

    console.log("Packet ID:", signedPacket.packetId);
    console.log("Transaction ID:", signedPacket.txnId);
    console.log("Amount:", signedPacket.amount);

    /*
     * Record balances before sync.
     */
    const senderBefore = await User.findById(SENDER_ID).lean();
    const receiverBefore = await User.findById(RECEIVER_ID).lean();

    console.log("\n===== BALANCES BEFORE =====\n");
    console.log("Sender:", senderBefore.balance);
    console.log("Receiver:", receiverBefore.balance);

    /*
 * Put ONE packet into the queue.
 *
 * Two syncQueue() calls will read the same queued packet
 * concurrently. This simulates two workers attempting to
 * settle the same packet at the same time.
 */
    offlineQueue.add(signedPacket);

    console.log("\n===== QUEUE BEFORE SYNC =====\n");
    console.log(offlineQueue.getAll());

    /*
     * Run two sync operations at the same time.
     */
    console.log("\n===== STARTING CONCURRENT SYNC =====\n");

    const [result1, result2] = await Promise.all([
        syncQueue(),
        syncQueue()
    ]);

    console.log("\n===== SYNC RESULT 1 =====\n");
    console.log(result1);

    console.log("\n===== SYNC RESULT 2 =====\n");
    console.log(result2);

    /*
     * Check resulting balances.
     */
    const senderAfter = await User.findById(SENDER_ID).lean();
    const receiverAfter = await User.findById(RECEIVER_ID).lean();

    console.log("\n===== BALANCES AFTER =====\n");
    console.log("Sender:", senderAfter.balance);
    console.log("Receiver:", receiverAfter.balance);

    /*
     * Check transaction count.
     */
    const transactions = await Transaction.find({
        packetId: signedPacket.packetId
    }).lean();

    console.log("\n===== TRANSACTION CHECK =====\n");
    console.log(JSON.stringify(transactions, null, 2));

    console.log("\nTransaction count:", transactions.length);

    /*
     * Check replay record.
     */
    const replayRecord = await ReplayPacket.findOne({
        packetId: signedPacket.packetId
    }).lean();

    console.log("\n===== REPLAY PACKET CHECK =====\n");
    console.log(JSON.stringify(replayRecord, null, 2));

    /*
     * Expected:
     *
     * Exactly ONE transaction.
     * Exactly ONE balance transfer.
     * Exactly ONE ReplayPacket.
     */
    const senderBalanceChanged =
        senderAfter.balance === senderBefore.balance - 100;

    const receiverBalanceChanged =
        receiverAfter.balance === receiverBefore.balance + 100;

    const exactlyOneTransaction =
        transactions.length === 1;

    const replayRecorded =
        replayRecord !== null;

    const totalSuccessfulSyncs =
        result1.synced + result2.synced;

    const totalFailedSyncs =
        result1.failed + result2.failed;

    const exactlyOneSuccess =
        totalSuccessfulSyncs === 1;

    const exactlyOneFailure =
        totalFailedSyncs === 1;

    console.log("\n================================");
    console.log("CONCURRENCY TEST RESULT");
    console.log("================================\n");

    console.log(
        "Exactly one sync succeeded:",
        exactlyOneSuccess
    );

    console.log(
        "Exactly one sync failed:",
        exactlyOneFailure
    );

    console.log(
        "Exactly one transaction:",
        exactlyOneTransaction
    );

    console.log(
        "Sender changed by exactly ₹100:",
        senderBalanceChanged
    );

    console.log(
        "Receiver changed by exactly ₹100:",
        receiverBalanceChanged
    );

    console.log(
        "ReplayPacket created:",
        replayRecorded
    );

    if (
        exactlyOneSuccess &&
        exactlyOneFailure &&
        exactlyOneTransaction &&
        senderBalanceChanged &&
        receiverBalanceChanged &&
        replayRecorded
    ) {
        console.log("\n✅ TEST PASSED");
        console.log(
            "Concurrent replay attempts resulted in exactly one settlement."
        );
        console.log(
            "Balance was updated exactly once."
        );
        console.log(
            "Exactly one transaction was created."
        );
        console.log(
            "Replay protection prevented the second settlement."
        );
    } else {
        console.log("\n❌ TEST FAILED");

        console.log("exactlyOneSuccess:", exactlyOneSuccess);
        console.log("exactlyOneFailure:", exactlyOneFailure);
        console.log("exactlyOneTransaction:", exactlyOneTransaction);
        console.log("senderBalanceChanged:", senderBalanceChanged);
        console.log("receiverBalanceChanged:", receiverBalanceChanged);
        console.log("replayRecorded:", replayRecorded);
        process.exitCode = 1;
    }

    /*
     * Cleanly close MongoDB.
     */
    await mongoose.connection.close();
}

runTest().catch((error) => {
    console.error("\nTEST FAILED:\n", error);
    process.exit(1);
});