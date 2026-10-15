require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const ReplayPacket = require("../models/ReplayPacket");

async function check() {

    await connectDB();

    console.log("\n===== DATABASE =====");

    console.log(
        "Database:",
        mongoose.connection.name
    );

    console.log(
        "Host:",
        mongoose.connection.host
    );
   // const ReplayPacket = require("../models/ReplayPacket");

const packets = await ReplayPacket.find({}).lean();

console.log("\n===== REPLAY PACKETS =====");
console.log(JSON.stringify(packets, null, 2));


    console.log("\n===== INITIALIZING REPLAY MODEL =====");

    await ReplayPacket.init();


    console.log("\n===== COLLECTIONS =====");

    const collections =
        await mongoose.connection.db
            .listCollections()
            .toArray();

    console.log(
        collections.map(
            collection => collection.name
        )
    );


    await mongoose.connection.close();
}

check().catch(error => {

    console.error(error);

    process.exit(1);
});