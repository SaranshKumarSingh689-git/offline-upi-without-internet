const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select : false
        },

        phone: {
            type: String,
            required: true,
            unique: true
        },

        upiId: {
            type: String,
            required: true,
            unique: true
        },

        publicKey: {
            type: String,
            default: ""
        },

        balance: {
            type: Number,
            default: 10000,
            min : 0
        },
        reservedBalance: {
            type: Number,
            default: 0,
            min : 0
        },
        upiPin: {
            type: String,
            default: null,
            select: false
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.models.User || mongoose.model("User", userSchema);