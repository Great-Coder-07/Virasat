import mongoose from "mongoose";

// Profile sub-schema
const profileSchema = new mongoose.Schema({
  bio: { type: String, default: "" },
  profilePhoto: { type: String, default: "" }, // Profile photo
  dob: {
    type: Date,
    default: null,
    validate: {
      validator: function (v) {
        return v == null || v <= new Date();
      },
      message: 'Date of birth cannot be in the future.'
    }
  }, // Date of Birth
  gender: { type: String, enum: ["Male", "Female", "Other"], default: null },
  location: { type: String, default: "" },
  family: { type: mongoose.Schema.Types.ObjectId, ref: "Family", default: null },
});

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          if (!v) return false;
          const words = v.trim().split(/\s+/).filter(Boolean);
          return words.length <= 100;
        },
        message: 'Full name exceeds 100 words.'
      }
    },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: Number, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Chronicler", "Contributor", "Viewer"], default: "Viewer", required: true },
    family: { type: mongoose.Schema.Types.ObjectId, ref: "Family", default: null },
    circleId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Circle", default: [] }],
    memories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Memory", default: [] }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    profile: { type: profileSchema, default: () => ({}) }, // ensures profile object always exists
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
