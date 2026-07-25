const express = require('express');
const {
  createListing,
  getListings,
  getListing,
  updateListing,
  uploadListingImages,
  markListingSold,
  deleteListing
} = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImages } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').get(getListings).post(protect, createListing);
router.post('/:listingId/images', protect, uploadImages.array('images', 5), uploadListingImages);
router.patch('/:listingId', protect, updateListing);
router.patch('/:listingId/mark-sold', protect, markListingSold);
router.route('/:listingId').get(getListing).delete(protect, deleteListing);

module.exports = router;
