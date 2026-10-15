const { v4: uuidv4 } = require("uuid");

const createPacket = ({
    sender,
    receiver,
    amount,
    txnId
}) => {

    const packet = {
        packetId: uuidv4(),
        txnId,
        sender,
        receiver,
        amount,
        timeStamp: Date.now(),
        ttl: 5,
    }

    return packet;
};

module.exports = {
    createPacket
};