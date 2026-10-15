require("dotenv").config();
const connectDB = require("./src/config/db");
// const user = require("./src/models/User");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoute");
const transactionRoutes = require("./src/routes/transactionRoutes");
const qrRoutes = require("./src/routes/QrRoutes");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(
    cors({
    origin : "http://localhost:3000"
}));
app.use(express.json());
connectDB();
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/qr", qrRoutes);
app.get("/", (req,res) =>{
    res.send("Server is running");
})
app.use("/api/auth", authRoutes);
// app.get("/users", async (req,res) =>{
//      const users = await user.find();
//      res.json(users);
// })
const PORT = process.env.PORT || 5000;
app.listen (PORT, async () =>{
    console.log(`Server is running on port ${PORT}`);
})