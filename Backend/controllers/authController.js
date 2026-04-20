const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { sendOTPEmail } = require("../services/emailService");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ================= REGISTER =================
const registerUser = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: "Please add all fields" });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res
        .status(400)
        .json({ message: "Enter a valid 10-digit phone number" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      otp,
      otpExpires,
      isVerified: false,
    });

    // Send OTP Email
    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: "Registration successful. Please check your email for the verification code.",
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= VERIFY OTP =================
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Account verified successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= RESEND OTP =================
const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP Email
    await sendOTPEmail(email, otp);

    res.json({ message: "A new verification code has been sent to your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isVerified) {
        return res.status(401).json({ message: "Please verify your email to log in." });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        location: user.location,
        jobTitle: user.jobTitle,
        bio: user.bio,
        profilePhoto: user.profilePhoto,
        notificationPreferences: user.notificationPreferences,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phoneNumber, dateOfBirth, location, jobTitle, bio } =
      req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Check if phone is being changed and already exists
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      if (!/^\d{10}$/.test(phoneNumber)) {
        return res
          .status(400)
          .json({ message: "Enter a valid 10-digit phone number" });
      }
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
    }

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.location = location || user.location;
    user.jobTitle = jobTitle || user.jobTitle;
    user.bio = bio || user.bio;

    if (req.body.notificationPreferences) {
      try {
        const prefs = typeof req.body.notificationPreferences === 'string' 
          ? JSON.parse(req.body.notificationPreferences) 
          : req.body.notificationPreferences;
        user.notificationPreferences = {
          ...user.notificationPreferences,
          ...prefs
        };
      } catch (e) {
        console.error("Error parsing notification preferences:", e);
      }
    }

    // Handle profile photo upload or removal
    if (req.body.removePhoto === "true") {
      user.profilePhoto = "";
    } else if (req.file) {
      user.profilePhoto = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      jobTitle: user.jobTitle,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      notificationPreferences: user.notificationPreferences,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GOOGLE LOGIN =================
const googleLogin = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: "No ID token provided" });

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      // New user signup via Google
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000;

      user = await User.create({
        name,
        email,
        googleId: sub,
        profilePhoto: picture,
        otp,
        otpExpires,
        isVerified: false,
      });

      await sendOTPEmail(email, otp);

      return res.json({
        requiresVerification: true,
        email: user.email,
        message: "Google account connected. Please verify your email with the code sent to your inbox.",
      });
    } else {
      // User exists - check verification status
      if (!user.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        
        // Link googleId if not already present
        if (!user.googleId) user.googleId = sub;
        if (picture && !user.profilePhoto) user.profilePhoto = picture;
        
        await user.save();
        await sendOTPEmail(email, otp);

        return res.json({
          requiresVerification: true,
          email: user.email,
          message: "Please complete your account verification. A code has been sent to your email.",
        });
      }

      // Existing verified user
      if (!user.googleId) {
        user.googleId = sub;
        if (picture && !user.profilePhoto) user.profilePhoto = picture;
        await user.save();
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      jobTitle: user.jobTitle,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({ message: "Google authentication failed" });
  }
};

// ================= ME (Get Profile) =================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      jobTitle: user.jobTitle,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      role: user.role,
      plan: user.plan,
      subscriptionExpires: user.subscriptionExpires,
      notificationPreferences: user.notificationPreferences,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  updateProfile,
  changePassword,
  googleLogin,
  getMe,
};