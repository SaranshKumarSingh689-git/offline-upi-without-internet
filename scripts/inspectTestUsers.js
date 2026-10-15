require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Database:", mongoose.connection.name);

        if (mongoose.connection.name !== "offline_upi_test") {
            throw new Error("Safety check failed: unexpected database.");
        }

        const emails = [
            "offline.sender.test@example.com",
            "offline.receiver.test@example.com",
            "auth.regression.test@example.com",
            "payment.sender.test@example.com",
            "payment.receiver.test@example.com"
        ];

        const users = await User.find({
            email: { $in: emails }
        }).select("+upiPin");

        for (const user of users) {
            console.log({
                name: user.fullName,
                email: user.email,
                balance: user.balance,
                reservedBalance: user.reservedBalance,
                hasUpiPin: Boolean(user.upiPin)
            });
        }
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

main();
