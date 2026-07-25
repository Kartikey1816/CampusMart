const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');
const { getTestEmail } = require('../utils/ensureDevelopmentTestUser');

const getAllowedDomains = () =>
  (process.env.ALLOWED_COLLEGE_EMAIL_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

const isCollegeEmail = (email) => {
  const allowedDomains = getAllowedDomains();
  return allowedDomains.length > 0 && allowedDomains.includes(email.split('@')[1]);
};

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt
});

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name || !normalizedEmail || !password) {
      const error = new Error('Name, college email, and password are required.');
      error.statusCode = 400;
      throw error;
    }

    if (!isCollegeEmail(normalizedEmail)) {
      const error = new Error('Use an email address from an allowed college domain.');
      error.statusCode = 400;
      throw error;
    }

    if (await User.exists({ email: normalizedEmail })) {
      const error = new Error('An account with this college email already exists.');
      error.statusCode = 409;
      throw error;
    }

    const user = new User({ name, email: normalizedEmail, password });
    const verificationToken = user.createEmailVerificationToken();
    await user.save();
    const emailResult = await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken
    });

    res.status(201).json({
      success: true,
      user: publicUser(user),
      verification: { message: 'Check your college inbox to verify your account.', ...emailResult }
    });
  } catch (error) {
    next(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();
    const genericResponse = { success: true, message: 'If that account needs verification, a new link has been sent.' };
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.isEmailVerified) return res.json(genericResponse);

    const verificationToken = user.createEmailVerificationToken();
    await user.save();
    const emailResult = await sendVerificationEmail({ email: user.email, name: user.name, token: verificationToken });
    res.json({ ...genericResponse, verification: emailResult });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      const error = new Error('Verification token is required.');
      error.statusCode = 400;
      throw error;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      const error = new Error('This verification link is invalid or has expired.');
      error.statusCode = 400;
      throw error;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'College email verified. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const submittedEmail = email?.trim().toLowerCase();
    const loginEmail = process.env.NODE_ENV !== 'production' && submittedEmail === 'admin'
      ? getTestEmail()
      : submittedEmail;
    const user = await User.findOne({ email: loginEmail }).select('+password');

    if (!user || !(await user.matchesPassword(password || ''))) {
      const error = new Error('Incorrect email or password.');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isEmailVerified) {
      const error = new Error('Verify your college email before logging in.');
      error.statusCode = 403;
      throw error;
    }

    res.json({ success: true, token: signToken(user._id), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

const getMe = (req, res) => res.json({ success: true, user: publicUser(req.user) });

module.exports = { signup, verifyEmail, resendVerificationEmail, login, getMe };
