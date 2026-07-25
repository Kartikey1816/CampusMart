const express = require('express');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.route('/').get(getWishlist);
router.route('/:listingId').post(addToWishlist).delete(removeFromWishlist);

module.exports = router;
