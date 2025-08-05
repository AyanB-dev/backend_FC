import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import Jwt from "jsonwebtoken";
// import asyncHandler from "../utils/asynchandler.js";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true

        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
        },
        avatar: {
            type: String,
            required: true,

        },
        coverImage: {
            type: String,
        },
        watchHistory: [{
            type: Schema.Types.ObjectId,
            ref: "Video"
        }],
        password: {
            type: String,
            required: [true, 'password is required'],
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.isPasswordCorrect = async function (next) {
    return await bcrypt.compare(next, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return Jwt.sign({
        _id: this._id,
        email: this.email,
        fullname: this.fullname,
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d"
    });
};

userSchema.methods.generateRefreshToken = function () {
    return Jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "10d"
    });
};




export const User = mongoose.model("User", userSchema);