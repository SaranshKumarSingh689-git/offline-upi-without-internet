require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

const SENDER_ID = "6ac18c6cd476bc649a4e4745";
const RECEIVER_ID = "6ac18c91d476bc649a4e4746";

async function setupTestDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected database:", mongoose.connection.name);

        if (mongoose.connection.name !== "offline_upi_test") {
            throw new Error(
                "Safety check failed: refusing to seed a non-test database."
            );
        }

        const accounts = [
            {
                _id: new mongoose.Types.ObjectId(SENDER_ID),
                fullName: "Offline Test Sender",
                email: "offline.sender.test@example.com",
                password: "test-password-not-for-production",
                phone: "9000000001",
                upiId: "offline.sender@test",
                balance: 10000,
                reservedBalance: 0
            },
            {
                _id: new mongoose.Types.ObjectId(RECEIVER_ID),
                fullName: "Offline Test Receiver",
                email: "offline.receiver.test@example.com",
                password: "test-password-not-for-production",
                phone: "9000000002",
                upiId: "offline.receiver@test",
                balance: 10000,
                reservedBalance: 0
            }
        ];

        for (const account of accounts) {
            const existingUser = await User.findById(account._id);

            if (existingUser) {
                console.log(
                    `User already exists; leaving unchanged: ${account._id}`
                );
                continue;
            }

            await User.create(account);

            console.log(`Created test user: ${account.fullName}`);
        }

        console.log("\nTest database setup completed.");
    } catch (error) {
        console.error("Test database setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}
setupTestDB();