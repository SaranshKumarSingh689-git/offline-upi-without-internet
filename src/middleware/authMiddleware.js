const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        const user = await User.findById(decoded.id)
            .select("-password -upiPin");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        req.user = user;
        req.user_id = user._id;

        next();

    } catch (error) {
        console.log(error);

        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

module.exports = protect;