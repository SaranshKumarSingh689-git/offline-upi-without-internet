const crypto = require("crypto");
// it will verify the signature , if matches true or else false;
function verifyPacket(packet,secretKey){
    // signature must exist 
    if(!packet.signature){
        return false;
    }
    // separate signature from the packet 
    const{ signature,...packetData} = packet;
    // recreate the signature
    const expectedSignature = crypto.createHmac("sha256", secretKey).update(JSON.stringify(packetData)).digest("hex");
    // timing - safe
    return crypto.timingSafeEqual(
        Buffer.from(signature,"hex"),
        Buffer.from(expectedSignature,"hex")
    );
}
module.exports = verifyPacket;