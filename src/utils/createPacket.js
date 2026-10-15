const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const PACKET_VERSION = 1;
const PACKET_TTL = 5 ; 
const PACKET_EXPIRY= 5 *60 * 1000; // 5 minutes

function createPacket({ sender, receiver, amount, txnId }) {
    // validate required field 
    if(!sender || !receiver || !txnId){
        throw new Error("Missing required fields: sender, receiver, txnId");
    }
    // validate the amount 
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error("Invalid amount");
    }

    const now = Date.now();
    return {
        packetId: uuidv4(),
        // actual payment transaction ID
        txnId,
        // protocol version
        version: PACKET_VERSION,

        sender,
        receiver,
        amount : numericAmount,

        // Prevent replay attacks
        nonce: crypto.randomBytes(16).toString("hex"),

        // Packet creation time
        timestamp: now,
        // Packet expiry time
        expiresAt: now + PACKET_EXPIRY,
        // Maximum relay count
        ttl: PACKET_TTL,

        // Devices crossed
        hops: [],

        // Packet state
        status: "PENDING"
    };
}

module.exports = createPacket;