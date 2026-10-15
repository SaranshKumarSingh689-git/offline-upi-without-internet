const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    sendMoney,
    syncTransactions,
    getTransactions
} = require("../controllers/transactioncontroller");
router.post("/send", protect, sendMoney);

router.get("/history", protect, getTransactions);

router.post("/sync", protect, syncTransactions);

module.exports = router;