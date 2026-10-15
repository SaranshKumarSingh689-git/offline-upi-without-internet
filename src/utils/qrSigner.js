const crypto = require('crypto');
const signQR = (payload) =>{
    return crypto.createHmac('sha256', process.env.QR_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');
};

const verifyQr = (payload, signature) =>{
    const expectedSignature = signQR(payload);
    return expectedSignature === signature;
};

module.exports = {
    signQR,
    verifyQr,
};