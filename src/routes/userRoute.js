const express = require("express");
const router = express.Router();

const {
    getProfile,
    setUPIPin,
    verifyUPIPin,
    findRecipient
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

router.get("/profile", protect, getProfile);

router.post("/set-pin", protect, setUPIPin);

router.post("/verify-pin", protect, verifyUPIPin);

// Find recipient by UPI ID
router.get("/recipient", protect, findRecipient);

module.exports = router;