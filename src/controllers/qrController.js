const User = require("../models/User");
const {
    signQR,
    verifyQr
} = require("../utils/qrSigner");


// Generate QR
const generateQR = async (req, res) => {
    try {
        const user = await User.findById(req.user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { amount } = req.query;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required"
            });
        }

        const payload = {
            upiId: user.upiId,
            amount: Number(amount),
            timestamp: Date.now()
        };

        const signature = signQR(payload);

        const qrData = JSON.stringify({
            payload,
            signature
        });

        return res.status(200).json({
            success: true,
            qrData,
            payload,
            signature
        });

    } catch (error) {
        console.error("Generate QR Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Scan QR
const scanQR = async (req, res) => {
    try {
        const { qrData } = req.body;

        if (!qrData) {
            return res.status(400).json({
                success: false,
                message: "QR data is required"
            });
        }

        let qrObject;

        try {
            qrObject = JSON.parse(qrData);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR format"
            });
        }

        const {
            payload,
            signature
        } = qrObject;

        if (
            !payload ||
            !payload.upiId ||
            !payload.timestamp ||
            !signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Malformed QR Code"
            });
        }

        // Verify QR signature
        const isValid = verifyQr(
            payload,
            signature
        );

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR Code"
            });
        }

        // QR expires after 5 minutes
        const FIVE_MINUTES = 5 * 60 * 1000;

        if (
            Date.now() - payload.timestamp >
            FIVE_MINUTES
        ) {
            return res.status(400).json({
                success: false,
                message: "QR Code Expired"
            });
        }

        // Find receiver
        const user = await User.findOne({
            upiId: payload.upiId
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (
            !payload.amount ||
            Number(payload.amount) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        return res.status(200).json({
            success: true,

            receiver: {
                userId: user._id,
                fullName: user.fullName,
                upiId: user.upiId
            },

            amount: Number(payload.amount)
        });

    } catch (error) {
        console.error("Scan QR Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


module.exports = {
    generateQR,
    scanQR
};