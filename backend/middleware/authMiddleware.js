const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    const error = new Error('Authentication required. Send a Bearer token.');
    error.statusCode = 401;
    return next(error);
  }

  let decoded;
  try {
    decoded = jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
  } catch (error) {
    error.statusCode = 401;
    error.message = 'Invalid or expired access token.';
    return next(error);
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      const error = new Error('The user for this token no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
