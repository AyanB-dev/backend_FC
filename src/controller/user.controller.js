import asyncHandler from '../utils/asynchandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Jwt from 'jsonwebtoken';

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove passowrd and refresh token field from response
    // check for user creation
    // return res

    const { fullname, username, email, password } = req.body;
    console.log("email:", email);
    console.log("fullname:", fullname);

    if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    // check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new ApiError(409, "User already exists with this username or email");
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );

});


const loginUser = asyncHandler(async (req, res) => {
    // steps to login user
    // req body -> data
    // username or email
    // find the user
    //password check
    //access and refresh token generation
    // send cookies
    // send response
    const { username, email, password } = req.body;

    // Password is always required
    if (!password || password.trim() === "") {
        throw new ApiError(400, "Password is required");
    }

    // At least one of username or email must be provided
    if ((!username || username.trim() === "") && (!email || email.trim() === "")) {
        throw new ApiError(400, "Username or email is required");
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!existingUser) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await existingUser.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const generateAccessAndRefreshToken = async (userId) => {
        try {
            const user = await User.findById(userId);
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();

            user.refreshToken = refreshToken;
            await user.save({ validateBeforeSave: false });

            return { accessToken, refreshToken };
        }
        catch (error) {
            throw new ApiError(500, "something went wrong while generating access and refresh token")
        }

    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existingUser._id);

    const loggedInUser = await User.findById(existingUser._id).select(
        "-password -refreshToken"
    );
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        )

});

// logout user
const LogoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "User logged out successfully"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }
    try {
        const decodedToken = Jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(404, "Invalid refresh token");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
        const options = {
            httpOnly: true,
            secure: true,
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");

    }


})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new ApiError(400, "Fullname and email are required");
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullname,
            email: email
        }
    },
        {
            new: true
        })
        .select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));

});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(500, "Failed to upload avatar image");
    }
    const updateAvatar = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: avatar.url
        }
    }, {
        new: true
    }).select("-password");
    return res.status(200).json(new ApiResponse(200, updateAvatar, "User avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path || req.files?.coverImage?.[0]?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url) {
        throw new ApiError(500, "Failed to upload cover image");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "User cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username || username.trim() === "") {
        throw new ApiError(400, "Username is required");
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "userId",
                as: "subscriptions"
            }
        },
        {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscrbedTo"
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscrbedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory.videoId",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [{
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                }]
            }
        },
        {
            $unwind: "$watchHistory"
        },
        {
            $project: {
                _id: 1,
                fullname: 1,
                username: 1,
                email: 1,
                "videoDetails.title": 1,
                "videoDetails.thumbnail": 1
            }
        }
    ])

});

export { registerUser, loginUser, LogoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory };