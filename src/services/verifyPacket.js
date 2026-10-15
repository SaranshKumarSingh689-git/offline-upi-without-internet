const crypto = require("crypto");
const canonicalizePacket = require("../utils/canonicalPacket");
const MAX_PACKET_AGE = 5 * 60 * 1000; // 5 minutes
const MAX_CLOCK_SKEW = 30 * 1000; // 30 seconds

function verifyPacket(packet, secretKey) {
    try {
        // 1. Basic validation
        if (!packet || typeof packet !== "object") {
            return {
                valid: false,
                message: "Invalid packet"
            };
        }

        if (!secretKey || typeof secretKey !== "string") {
            return {
                valid: false,
                message: "Invalid secret key"
            };
        }

        // 2. Extract required fields
        const {
            packetId,
            txnId,
            version,
            sender,
            receiver,
            amount,
            nonce,
            timestamp,
            expiresAt,
            signature
        } = packet;

        // 3. Required field validation
        if (
            !packetId ||
            !txnId ||
            version === undefined ||
            !sender ||
            !receiver ||
            amount === undefined ||
            !nonce ||
            timestamp === undefined ||
            expiresAt === undefined ||
            !signature
        ) {
            return {
                valid: false,
                message: "Required fields missing"
            };
        }

        // 4. Validate amount
        const numericAmount = Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            return {
                valid: false,
                message: "Invalid amount"
            };
        }

        // 5. Validate timestamps
        if (
            !Number.isFinite(timestamp) ||
            !Number.isFinite(expiresAt)
        ) {
            return {
                valid: false,
                message: "Invalid packet timestamp"
            };
        }

        const now = Date.now();

        // Packet cannot be created too far in the future
        if (timestamp > now + MAX_CLOCK_SKEW) {
            return {
                valid: false,
                message: "Packet timestamp is in the future"
            };
        }

        // Packet cannot be older than allowed
        if (now - timestamp > MAX_PACKET_AGE) {
            return {
                valid: false,
                message: "Packet too old"
            };
        }

        // Expiry must be after creation
        if (expiresAt <= timestamp) {
            return {
                valid: false,
                message: "Invalid packet expiry"
            };
        }

        // Packet must not be expired
        if (now > expiresAt) {
            return {
                valid: false,
                message: "Packet expired"
            };
        }

        // 6. Validate signature format
        if (!/^[a-f0-9]{64}$/i.test(signature)) {
            return {
                valid: false,
                message: "Invalid signature format"
            };
        }

        // 7. Recreate EXACTLY the same data that was signed
        const data = canonicalizePacket(packet);

        const expectedSignature = crypto
            .createHmac("sha256", secretKey)
            .update(data)
            .digest("hex");

        // 8. Timing-safe signature comparison
        const receivedBuffer = Buffer.from(signature, "hex");
        const expectedBuffer = Buffer.from(
            expectedSignature,
            "hex"
        );

        if (
            receivedBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(
                receivedBuffer,
                expectedBuffer
            )
        ) {
            return {
                valid: false,
                message: "Invalid packet signature"
            };
        }

        // 9. Packet is cryptographically valid
        return {
            valid: true,
            message: "Packet verified successfully"
        };

    } catch (error) {
        console.error(
            "Packet verification error:",
            error.message
        );

        return {
            valid: false,
            message: "Packet verification failed"
        };
    }
}

module.exports = {
    verifyPacket
};