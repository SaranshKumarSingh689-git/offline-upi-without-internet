require("dotenv").config();

const mongoose = require("mongoose");
const Transaction = require("../src/models/Transaction");

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        if (mongoose.connection.name !== "offline_upi_test") {
            throw new Error("Safety check failed: unexpected database.");
        }

        const tx = await Transaction.findOne({
            transactionId: "2b449826-a956-4894-85c7-69c4c70c90d9"
        });

        if (!tx) {
            console.log("TEST FAILED: Transaction not found.");
            process.exitCode = 1;
            return;
        }

        console.log({
            transactionId: tx.transactionId,
            amount: tx.amount,
            status: tx.status,
            offline: tx.offline,
            syncedAt: tx.syncedAt
        });

        if (tx.status === "SUCCESS" && tx.offline === true) {
            console.log("TEST PASSED: Offline transaction synchronized.");
        } else {
            console.log("TEST FAILED: Unexpected transaction state.");
            process.exitCode = 1;
        }
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

main();

