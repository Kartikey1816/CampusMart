const mongoose = require('mongoose');
const User = require('../models/User');

const publicProfile = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  avatarUrl: user.avatarUrl || null,
  hostel: user.hostel || null,
  department: user.department || null,
  year: user.year || null,
  ratings: {
    average: user.ratingAverage,
    count: user.ratingCount
  },
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const publicSellerProfile = (user) => ({
  id: user._id,
  name: user.name,
  avatarUrl: user.avatarUrl || null,
  hostel: user.hostel || null,
  department: user.department || null,
  year: user.year || null,
  ratings: {
    average: user.ratingAverage,
    count: user.ratingCount
  },
  createdAt: user.createdAt
});

const getMyProfile = (req, res) => {
  res.json({ success: true, profile: publicProfile(req.user) });
};

const getProfileById = async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.userId)) {
      const error = new Error('Profile ID is invalid.');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      const error = new Error('Profile not found.');
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, profile: publicSellerProfile(user) });
  } catch (error) {
    next(error);
  }
};

const validateOptionalText = (value, fieldName, maxLength) => {
  if (value === null || value === '') return undefined;
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${fieldName} must be non-empty text.`);
    error.statusCode = 400;
    throw error;
  }

  const cleanedValue = value.trim();
  if (cleanedValue.length > maxLength) {
    const error = new Error(`${fieldName} cannot exceed ${maxLength} characters.`);
    error.statusCode = 400;
    throw error;
  }
  return cleanedValue;
};

const updateMyProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'avatarUrl', 'hostel', 'department', 'year'];
    const suppliedFields = allowedFields.filter((field) => req.body[field] !== undefined);

    if (!suppliedFields.length) {
      const error = new Error('Provide the profile fields you want to update.');
      error.statusCode = 400;
      throw error;
    }

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        const error = new Error('Name cannot be empty.');
        error.statusCode = 400;
        throw error;
      }
      req.user.name = req.body.name.trim();
    }

    if (req.body.avatarUrl !== undefined) {
      const avatarUrl = validateOptionalText(req.body.avatarUrl, 'Avatar URL', 2048);
      if (avatarUrl && !/^https?:\/\/\S+$/i.test(avatarUrl)) {
        const error = new Error('Avatar URL must be a valid HTTP(S) URL.');
        error.statusCode = 400;
        throw error;
      }
      req.user.avatarUrl = avatarUrl;
    }
    if (req.body.hostel !== undefined) {
      req.user.hostel = validateOptionalText(req.body.hostel, 'Hostel', 80);
    }
    if (req.body.department !== undefined) {
      req.user.department = validateOptionalText(req.body.department, 'Department', 100);
    }
    if (req.body.year !== undefined) {
      if (req.body.year === null || req.body.year === '') {
        req.user.year = undefined;
      } else if (!Number.isInteger(req.body.year) || req.body.year < 1 || req.body.year > 8) {
        const error = new Error('Year must be a whole number between 1 and 8.');
        error.statusCode = 400;
        throw error;
      } else {
        req.user.year = req.body.year;
      }
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: publicProfile(req.user)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyProfile, getProfileById, updateMyProfile };
