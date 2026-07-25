const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const listingView = (listing) => ({
  id: listing._id,
  title: listing.title,
  description: listing.description,
  price: listing.price,
  category: listing.category,
  condition: listing.condition,
  pickupLocation: listing.pickupLocation,
  images: listing.images,
  status: listing.status,
  seller: listing.seller,
  createdAt: listing.createdAt,
  updatedAt: listing.updatedAt
});

const getListingOrThrow = async (listingId) => {
  if (!mongoose.isObjectIdOrHexString(listingId)) {
    const error = new Error('Listing ID is invalid.');
    error.statusCode = 400;
    throw error;
  }

  const listing = await Listing.findById(listingId).populate(
    'seller',
    'name avatarUrl hostel department year ratingAverage ratingCount'
  );
  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }
  return listing;
};

const getWishlist = async (req, res, next) => {
  try {
    await req.user.populate({
      path: 'wishlist',
      populate: { path: 'seller', select: 'name avatarUrl hostel department year ratingAverage ratingCount' },
      options: { sort: { createdAt: -1 } }
    });

    const listings = req.user.wishlist.filter(Boolean);
    if (listings.length !== req.user.wishlist.length) {
      req.user.wishlist = listings.map((listing) => listing._id);
      await req.user.save();
    }

    res.json({ success: true, listings: listings.map(listingView) });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const listing = await getListingOrThrow(req.params.listingId);
    if (listing.seller._id.toString() === req.user._id.toString()) {
      const error = new Error('You cannot add your own listing to your wishlist.');
      error.statusCode = 400;
      throw error;
    }
    if (listing.status !== 'available') {
      const error = new Error('Only available listings can be added to your wishlist.');
      error.statusCode = 400;
      throw error;
    }

    const alreadyWishlisted = req.user.wishlist.some((id) => id.toString() === listing._id.toString());
    if (!alreadyWishlisted) {
      req.user.wishlist.push(listing._id);
      await req.user.save();
    }

    res.status(alreadyWishlisted ? 200 : 201).json({
      success: true,
      message: alreadyWishlisted ? 'Listing is already in your wishlist.' : 'Listing added to your wishlist.',
      listing: listingView(listing)
    });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.listingId)) {
      const error = new Error('Listing ID is invalid.');
      error.statusCode = 400;
      throw error;
    }

    const listingId = req.params.listingId.toString();
    const originalCount = req.user.wishlist.length;
    req.user.wishlist = req.user.wishlist.filter((id) => id.toString() !== listingId);
    if (req.user.wishlist.length !== originalCount) await req.user.save();

    res.json({
      success: true,
      message: originalCount === req.user.wishlist.length
        ? 'Listing was not in your wishlist.'
        : 'Listing removed from your wishlist.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
