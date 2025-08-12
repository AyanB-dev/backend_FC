import { Router } from "express";
import { registerUser, loginUser, getCurrentUser, refreshAccessToken, getUserChannelProfile, getWatchHistory } from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { LogoutUser  } from "../controller/user.controller.js";
const router = Router();


router.route("/register").post(upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
]), registerUser);

router.route("/login").post(loginUser);
// secured routes
router.route("/logout").post(verifyJWT, LogoutUser);
router.route("/refresh-token").post(verifyJWT, refreshAccessToken);
router.route("/change-password").post(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, getCurrentUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, getCurrentUser);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), getCurrentUser);
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), getCurrentUser);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);


export default router;
 