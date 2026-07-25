const express = require('express');
const { signup, verifyEmail, resendVerificationEmail, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
