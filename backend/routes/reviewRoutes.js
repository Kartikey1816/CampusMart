const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createReview, getSellerReviews } = require('../controllers/reviewController');

const router = express.Router();

router.get('/sellers/:sellerId', protect, getSellerReviews);
router.post('/listings/:listingId', protect, createReview);

module.exports = router;
