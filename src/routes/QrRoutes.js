const express = require("express");
const router = express.Router();
const { generateQR, scanQR} = require("../controllers/qrController");
const protect = require("../middleware/authMiddleware");
router.get("/generate", protect, generateQR);
router.post("/scan", protect, scanQR);
module.exports = router;