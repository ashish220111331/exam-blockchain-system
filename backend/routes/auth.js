const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/EmailService');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, userType, centerId } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user (not verified yet)
    const user = new User({
      email,
      password,
      name,
      userType,
      centerId: userType === 'center' ? centerId : undefined,
      isVerified: false,
      emailVerificationOTP: otp,
      emailVerificationOTPExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    await user.save();

    // Send OTP email
    await emailService.sendVerificationOTP(email, otp, name);

    res.status(201).json({ 
      message: 'Registration successful! Please check your email for verification code.',
      email: email,
      requiresVerification: true
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: error.message });
  }
});

// Verify Email OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (user.emailVerificationOTPExpires < Date.now()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Verify user
    user.isVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.name, user.userType);

    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send OTP email
    await emailService.sendVerificationOTP(email, otp, user.name);

    res.json({ message: 'Verification code resent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Find user
    const user = await User.findOne({ email, userType });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({ 
        error: 'Account is locked due to multiple failed login attempts. Please try again later.' 
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email first',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        userType: user.userType, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        centerId: user.centerId,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password - Request OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, you will receive a password reset code' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.passwordResetOTP = otp;
    user.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP email
    await emailService.sendPasswordResetOTP(email, otp, user.name);

    res.json({ message: 'Password reset code sent to your email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password - Verify OTP and Set New Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.passwordResetOTP || user.passwordResetOTP !== otp) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (user.passwordResetOTPExpires < Date.now()) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now login with your new password.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;