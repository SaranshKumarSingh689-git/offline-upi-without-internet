const processedPackets = new Map();
const isPacketProcessed = (packetId) => {
    return processedPackets.has(packetId);
};
const markPacketProcessed = (packetId) =>{
    processedPackets.set(packetId,Date.now());
};

const removeOldPackets = (maxAge) =>{
    const now = Date.now();

    for(const [packetId,processedAt] of processedPackets) {
        if(now - processedAt > maxAge){
            processedPackets.delete(packetId);
        }
    }
};
module.exports = {
    isPacketProcessed,
    markPacketProcessed,
    removeOldPackets
}