import express from "express";
import { login, logout, register, verifyInvite, updateUserProfile, verifyOTP, me } from "../controllers/user.controller.js";
import upload from "../middlewares/multer.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Add this route for profile update
// 'profilePhoto' should match the input name in FormData
router.route("/:id").put(isAuthenticated, upload.single("profilePhoto"), updateUserProfile);

router.route("/register").post(register)
router.route("/login").post(login)
router.route("/logout").get(logout)
router.route("/verify-invite").post(verifyInvite)
router.post("/verify-otp", verifyOTP);
router.get('/me', isAuthenticated, me);
export default router