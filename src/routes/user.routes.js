import { Router } from "express";
import { registerUser, loginUser } from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { LogoutUser } from "../controller/user.controller.js";
const router = Router();


router.route("/register").post(upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
]), registerUser);

router.route("/login").post(loginUser);
// secured routes
router.route("/logout").post(verifyJWT, LogoutUser);
router.route("/refresh-token").post(verifyJWT, refreshAccessToken);


export default router;
 