const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Set UPI PIN
const setUPIPin = async (req, res) => {
    try {
        const { pin } = req.body;

        if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({
                success: false,
                message: "PIN must be exactly 4 digits"
            });
        }

        const user = await User.findById(req.user_id)
            .select("+upiPin");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Allow initial setup only; never overwrite an existing PIN.
        if (user.upiPin) {
            return res.status(409).json({
                success: false,
                message: "UPI PIN is already set"
            });
        }

        user.upiPin = await bcrypt.hash(pin, 10);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "UPI PIN set successfully"
        });
    } catch (error) {
        console.error("Set UPI PIN error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to set UPI PIN"
        });
    }
};

// Verify UPI PIN
const verifyUPIPin = async (req, res) => {
    try {
        const { pin } = req.body;

        if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({
                success: false,
                message: "PIN must be exactly 4 digits"
            });
        }

        const user = await User.findById(req.user_id)
            .select("+upiPin");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.upiPin) {
            return res.status(400).json({
                success: false,
                message: "UPI PIN has not been set"
            });
        }

        const valid = await bcrypt.compare(pin, user.upiPin);

        if (!valid) {
            return res.status(400).json({
                success: false,
                message: "Invalid UPI PIN"
            });
        }

        return res.status(200).json({
            success: true,
            message: "PIN verified successfully"
        });
    } catch (error) {
        console.error("Verify UPI PIN error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to verify UPI PIN"
        });
    }
};

// Get Profile
const getProfile = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                upiId: user.upiId,
                balance: user.balance,
                publicKey: user.publicKey
            }
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load profile"
        });
    }
};

// Find recipient by UPI ID
const findRecipient = async (req, res) => {
    try {
        const { upiId } = req.query;

        if (typeof upiId !== "string" || !upiId.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a UPI ID"
            });
        }

        const normalizedUpiId = upiId.trim().toLowerCase();

        const recipient = await User.findOne({
            upiId: normalizedUpiId
        }).select("_id fullName upiId");

        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: "No account found with this UPI ID"
            });
        }

        if (
            req.user_id &&
            recipient._id.toString() === req.user_id.toString()
        ) {
            return res.status(400).json({
                success: false,
                message: "You cannot send money to yourself"
            });
        }

        return res.status(200).json({
            success: true,
            recipient
        });
    } catch (error) {
        console.error("Find recipient error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to find recipient"
        });
    }
};

module.exports = {
    getProfile,
    setUPIPin,
    verifyUPIPin,
    findRecipient
};