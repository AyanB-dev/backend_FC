import mongoose, { mongo, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import Jwt from "jsonwebtoken";

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

userSchema.method.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// userSchema.method.generateAuthToken = function () {
//     const token = jsonwebtoken.sign({ id: this._id }, process.env.JWT_SECRET, {
//         expiresIn: "1d"
//     });
//     return token;
// };

userSchema.method.generateAccessToken = function () {
    Jwt.sign({
        _id: this._id,
        email: this.email,
        fullname: this.fullname,
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d"
    });
};

userSchema.method.generateRefreshToken = function () {
    Jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "10d"
    });
};

export const User = mongoose.model("User", userSchema);