const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP error:', err);
  } else {
    console.log('✅ Ready to send emails');
  }
});

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        name,
        email,
        password,
      });

      const token = generateToken(user._id);

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error during signup' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user._id);

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // CHANGE THIS LINE - use frontend URL instead of backend URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    // Or use environment variable:
    // const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    try {
      await transporter.sendMail({
        from: '"Expense Tracker" <zadic42@gmail.com>',
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set the new password (it will be hashed by the User model's pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: 'Google OAuth is not configured' });
  }

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  res.redirect(`${authUrl}?${params.toString()}`);
});

// @route   GET /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
// @route   GET /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/login?error=No authorization code received`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { access_token } = tokenResponse.data;

    // Get user info from Google
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const { id: googleId, email, name, picture } = userResponse.data;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with Google info if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        picture,
        password: crypto.randomBytes(32).toString('hex') // Random password for OAuth users
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Redirect to frontend with token AND user data
    const params = new URLSearchParams({
      token,
      id: user._id.toString(),
      email: user.email,
      name: user.name
    });

    res.redirect(`${FRONTEND_URL}/login?${params.toString()}`);

  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/login?error=Authentication failed`);
  }
});

module.exports = router;