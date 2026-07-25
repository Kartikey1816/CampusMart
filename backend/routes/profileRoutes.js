const express = require('express');
const { getMyProfile, getProfileById, updateMyProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.route('/me').get(getMyProfile).patch(updateMyProfile);
router.get('/:userId', getProfileById);

module.exports = router;
