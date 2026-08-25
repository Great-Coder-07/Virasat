import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';

import transporter from "../config/mailer.js";

/**
 * @description Generates a random 6-digit OTP.
 * @returns {string} The 6-digit OTP as a string.
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @description Registers a new user, sends a verification OTP.
 */
export const register = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, password } = req.body;
        const normalizedFullName = fullName?.trim();
        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedPhoneNumber = String(phoneNumber ?? "").trim();

        if (!fullName || !email || !phoneNumber || !password) {
            return res.status(400).json({
                message: "All fields are required.",
                success: false,
            });
        }

        if (!/^\d{10}$/.test(normalizedPhoneNumber)) {
            return res.status(400).json({
                message: "Phone number must be exactly 10 digits.",
                success: false,
            });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(409).json({
                message: "User already exists with this email.",
                success: false,
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = generateOTP(); // Use the helper function
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        await User.create({
            fullName: normalizedFullName,
            email: normalizedEmail,
            phoneNumber: Number(normalizedPhoneNumber),
            password: hashedPassword,
            otp: verificationCode,
            otpExpiry: new Date(otpExpiry),
            isVerified: false, // Explicitly set to false on creation
        });

        // Send verification email
        const mailOptions = {
            // FIX: Correctly access the environment variable without quotes.
            from: process.env.EMAIL_USER,
            to: normalizedEmail,
            subject: 'OTP Verification for Your Account',
            text: `Welcome! Your One-Time Password (OTP) is: ${verificationCode}\nIt will expire in 10 minutes.`
        };

        await transporter.sendMail(mailOptions);

        return res.status(201).json({
            message: "Account created successfully. Please check your email for the OTP.",
            success: true,
        });
    } catch (error) {
        console.error("Error in register function:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "User already exists with this email.",
                success: false,
            });
        }

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                message: error.message,
                success: false,
            });
        }

        if (error.name?.includes("Error") && error.message?.toLowerCase().includes("invalid login")) {
            return res.status(500).json({
                message: "Verification email could not be sent. Check EMAIL_USER and EMAIL_PASS.",
                success: false,
            });
        }

        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

/**
 * @description Logs in an existing user and returns a JWT.
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
                success: false,
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        // IMPROVEMENT: Check if the user is verified before allowing login
        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in.",
                success: false,
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        const tokenData = { userId: user._id };
        const token = jwt.sign(tokenData, process.env.JWT_AUTH_KEY, { expiresIn: '1d' });

        const loggedUser = await User.findById(user._id).populate('family');
        const isFamily = loggedUser.family && loggedUser.family.toString().trim() !== "" ? true : false;

        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile,
        };

        return res.status(200)
            .cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' })
            .json({
                message: `Welcome back, ${user.fullName}`,
                user: userResponse,
                success: true,
                isFamily: isFamily,
                family: loggedUser.family || null,
            });
    } catch (error) {
        console.error("Error in login function:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

/**
 * @description Logs out the user by clearing the JWT cookie.
 */
export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully.",
            success: true,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal Server Error during logout.",
            success: false,
        });
    }
};

/**
 * @description Verifies a JWT for a family invitation.
 */
export const verifyInvite = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token is required", success: false });
        }
        const decoded = jwt.verify(token, process.env.JWT_INVITE_KEY);
        return res.status(200).json({
            message: "Token is valid",
            success: true,
            data: decoded,
        });
    } catch (error) {
        console.error("Error in verifyInvite function:", error);
        return res.status(401).json({ // Use 401 for invalid tokens
            message: "Invalid or expired token",
            success: false,
        });
    }
}

/**
 * @description Verifies the OTP sent to a user's email.
 */
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required.', success: false });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.', success: false });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'Account is already verified.', success: false });
        }

        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP.', success: false });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now log in.'
        });
    } catch (error) {
        console.error("Error in verifyOTP function:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

/**
 * @description Resends a new OTP to the user's email.
 */
export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required.", success: false });
        }
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.', success: false });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'Account is already verified.', success: false });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your New OTP Verification',
            text: `Your new OTP is: ${otp}\nIt will expire in 10 minutes.`
        });

        res.status(200).json({
            success: true,
            message: 'A new OTP has been sent to your email.'
        });
    } catch (error) {
        console.error("Error in resendOTP function:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId; // auth middleware
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: No user found.",
        success: false,
      });
    }

    const { fullName, phoneNumber, bio, dob, gender, location } = req.body;
    const updates = {
      ...(fullName && { fullName }),
      ...(phoneNumber && { phoneNumber }),
      ...(bio && { "profile.bio": bio }),
      ...(dob && { "profile.dob": dob }),
      ...(gender && { "profile.gender": gender }),
      ...(location && { "profile.location": location }),
    };

    // Handle uploaded profile photo
    if (req.file) {
      const result = await cloudinary.uploader.upload_stream(
        { folder: 'profiles' },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({
              message: "Failed to upload profile photo",
              success: false,
            });
          }
          updates["profile.profilePhoto"] = result.secure_url;

          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
          );

          return res.status(200).json({
            message: "Profile updated successfully.",
            success: true,
            user: updatedUser,
          });
        }
      );

      // Pipe file buffer to Cloudinary
      result.end(req.file.buffer);
      return;
    }

    // If no profile photo uploaded
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Profile updated successfully.",
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.log("Error updating user profile:", error);
    return res.status(500).json({
      message: "Failed to update profile.",
      success: false,
    });
  }
};
