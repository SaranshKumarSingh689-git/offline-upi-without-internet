function canonicalizePacket(packet) {
const { packetId,txnId, version, sender, receiver,amount, nonce, timestamp, expiresAt} = packet;

return JSON.stringify({
    packetId,
    txnId,
    version,    
    sender,
    receiver,
    amount,
    nonce,  
    timestamp,
    expiresAt
});
}
module.exports = canonicalizePacket;