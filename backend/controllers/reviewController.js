const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const User = require('../models/User');

const invalidId = (message) => { const error = new Error(message); error.statusCode = 400; return error; };

const reviewView = (review) => ({
  id: review._id,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  reviewer: { id: review.reviewer._id, name: review.reviewer.name, avatarUrl: review.reviewer.avatarUrl || null }
});

const refreshSellerRating = async (sellerId) => {
  const [summary] = await Review.aggregate([
    { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  await User.findByIdAndUpdate(sellerId, { ratingAverage: summary?.average || 0, ratingCount: summary?.count || 0 });
};

const getSellerReviews = async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.sellerId)) throw invalidId('Seller ID is invalid.');
    const reviews = await Review.find({ seller: req.params.sellerId }).populate('reviewer', 'name avatarUrl').sort({ createdAt: -1 });
    res.json({ success: true, reviews: reviews.map(reviewView) });
  } catch (error) { next(error); }
};

const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!mongoose.isObjectIdOrHexString(req.params.listingId)) throw invalidId('Listing ID is invalid.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw invalidId('Rating must be a whole number from 1 to 5.');
    if (typeof comment !== 'string' || comment.trim().length < 3 || comment.trim().length > 500) throw invalidId('Review comment must be between 3 and 500 characters.');

    const listing = await Listing.findById(req.params.listingId);
    if (!listing) { const error = new Error('Listing not found.'); error.statusCode = 404; throw error; }
    if (listing.status !== 'sold') throw invalidId('A review can only be left after the listing is marked sold.');
    if (listing.seller.toString() === req.user._id.toString()) throw invalidId('You cannot review your own listing.');
    const conversation = await Conversation.exists({ listing: listing._id, buyer: req.user._id, seller: listing.seller });
    if (!conversation) { const error = new Error('Only a buyer who contacted this seller about the listing can leave a review.'); error.statusCode = 403; throw error; }

    const review = await Review.create({ listing: listing._id, seller: listing.seller, reviewer: req.user._id, rating, comment: comment.trim() });
    await refreshSellerRating(listing.seller);
    await review.populate('reviewer', 'name avatarUrl');
    res.status(201).json({ success: true, message: 'Review published.', review: reviewView(review) });
  } catch (error) {
    if (error?.code === 11000) { error = new Error('You have already reviewed this listing.'); error.statusCode = 409; }
    next(error);
  }
};

module.exports = { getSellerReviews, createReview };
