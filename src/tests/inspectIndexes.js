
require("dotenv").config();
const mongoose = require("mongoose");

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Database:", mongoose.connection.name);

    for (const name of ["transactions", "replaypackets"]) {
        try {
            const indexes = await mongoose.connection.db
                .collection(name)
                .indexes();

            console.log(`\nIndexes for ${name}:`);
            console.dir(indexes, { depth: null });
        } catch (error) {
            console.log(`Could not inspect ${name}:`, error.message);
        }
    }
}

main()
    .catch(error => {
        console.error("Inspection failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
 