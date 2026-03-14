import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      return next(new Error("Email already exists"));
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "staff",
    });

    if (user) {
      const token = generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(400);
      return next(new Error("Invalid user data"));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: trimmedEmail });

    if (user && (await user.matchPassword(password.trim()))) {
      const token = generateToken(res, user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        loginId: user.loginId,
        role: user.role,
        token,
      });
    } else {
      res.status(401);
      return next(new Error("Invalid Email or Password"));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Reset OTP
// @route   POST /api/auth/request-reset-otp
// @access  Public
export const requestResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak if user exists or not
      return res
        .status(200)
        .json({
          message:
            "If an account with that email exists, an OTP has been sent.",
        });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove existing OTPs for the user
    await OTP.deleteMany({ email });

    // Save new OTP, expires in 10 minutes
    await OTP.create({
      email,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Send email
    const message = `Your password reset OTP is ${otp}. It will expire in 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: "CoreInventory Password Reset OTP",
      message,
    });

    res
      .status(200)
      .json({
        message: "If an account with that email exists, an OTP has been sent.",
      });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
export const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      res.status(400);
      return next(new Error("Invalid or expired OTP"));
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      res.status(400);
      return next(new Error("Invalid or expired OTP"));
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      return next(new Error("User not found"));
    }

    user.password = newPassword;
    await user.save();

    // Delete OTP record after successful reset
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
