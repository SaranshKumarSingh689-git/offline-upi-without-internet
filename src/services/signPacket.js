const crypto = require("crypto");
const canonicalizePacket = require("../utils/canonicalPacket");
function signPacket(packet, secretKey) {
    
    if(!secretKey || typeof secretKey !== "string") {
        throw new Error("Invalid secret key");
    }
    const data = canonicalizePacket(packet);

    const signature = crypto
        .createHmac("sha256", secretKey)
        .update(data)
        .digest("hex");

    return {
        ...packet,
        signature
    };
}

module.exports = signPacket;