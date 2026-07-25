const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const { uploadDirectory } = require('../middleware/uploadMiddleware');

const allowedFields = ['title', 'description', 'price', 'category', 'condition', 'pickupLocation'];
const allowedConditions = ['new', 'like-new', 'good', 'fair'];
const allowedStatuses = ['available', 'sold'];
const allowedSorts = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 }
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const queryText = (value, name) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw badRequest(`${name} must be a single text value.`);
  return value.trim();
};

const queryPrice = (value, name) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim()) throw badRequest(`${name} must be a non-negative number.`);
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) throw badRequest(`${name} must be a non-negative number.`);
  return price;
};

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

const validateListingFields = (body, isCreate = false) => {
  const fields = {};
  const requiredFields = ['title', 'description', 'price', 'category', 'condition', 'pickupLocation'];

  if (isCreate) {
    const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missing.length) {
      const error = new Error(`Required fields: ${missing.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }
  }

  for (const field of allowedFields) {
    if (body[field] === undefined) continue;
    if (field === 'price') {
      if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0) {
        const error = new Error('Price must be a non-negative number.');
        error.statusCode = 400;
        throw error;
      }
      fields.price = body.price;
      continue;
    }

    if (typeof body[field] !== 'string' || !body[field].trim()) {
      const error = new Error(`${field} must be non-empty text.`);
      error.statusCode = 400;
      throw error;
    }
    fields[field] = body[field].trim();
  }

  if (fields.condition && !allowedConditions.includes(fields.condition)) {
    const error = new Error('Condition must be new, like-new, good, or fair.');
    error.statusCode = 400;
    throw error;
  }
  return fields;
};

const getListingOrThrow = async (listingId) => {
  if (!mongoose.isObjectIdOrHexString(listingId)) {
    const error = new Error('Listing ID is invalid.');
    error.statusCode = 400;
    throw error;
  }
  const listing = await Listing.findById(listingId).populate('seller', 'name avatarUrl hostel department year ratingAverage ratingCount');
  if (!listing) {
    const error = new Error('Listing not found.');
    error.statusCode = 404;
    throw error;
  }
  return listing;
};

const ensureOwner = (listing, userId) => {
  if (listing.seller._id.toString() !== userId.toString()) {
    const error = new Error('You can only manage your own listings.');
    error.statusCode = 403;
    throw error;
  }
};

const removeUploadedFiles = async (files = []) => {
  await Promise.all(files.map(async ({ filename }) => {
    if (!filename) return;
    try {
      await fs.unlink(path.join(uploadDirectory, path.basename(filename)));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }));
};

const createListing = async (req, res, next) => {
  try {
    const fields = validateListingFields(req.body, true);
    const listing = await Listing.create({ ...fields, seller: req.user._id });
    res.status(201).json({ success: true, message: 'Listing created successfully.', listing: listingView(listing) });
  } catch (error) {
    next(error);
  }
};

const getListings = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 50);
    const filter = {};
    const search = queryText(req.query.q, 'q');
    const category = queryText(req.query.category, 'category');
    const condition = queryText(req.query.condition, 'condition')?.toLowerCase();
    const status = queryText(req.query.status, 'status')?.toLowerCase();
    const seller = queryText(req.query.seller, 'seller');
    const minPrice = queryPrice(req.query.minPrice, 'minPrice');
    const maxPrice = queryPrice(req.query.maxPrice, 'maxPrice');
    const sort = queryText(req.query.sort, 'sort') || 'newest';

    if (condition && !allowedConditions.includes(condition)) {
      throw badRequest(`condition must be one of: ${allowedConditions.join(', ')}.`);
    }
    if (status && !allowedStatuses.includes(status)) {
      throw badRequest(`status must be one of: ${allowedStatuses.join(', ')}.`);
    }
    if (seller && !mongoose.isObjectIdOrHexString(seller)) {
      throw badRequest('seller must be a valid user ID.');
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw badRequest('minPrice cannot be greater than maxPrice.');
    }
    if (!allowedSorts[sort]) {
      throw badRequest(`sort must be one of: ${Object.keys(allowedSorts).join(', ')}.`);
    }

    if (status) filter.status = status;
    if (category) filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (condition) filter.condition = condition;
    if (seller) filter.seller = seller;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    if (search) filter.$text = { $search: search };

    const [listings, total] = await Promise.all([
      Listing.find(filter).populate('seller', 'name avatarUrl hostel department year ratingAverage ratingCount').sort(allowedSorts[sort]).skip((page - 1) * limit).limit(limit),
      Listing.countDocuments(filter)
    ]);
    res.json({
      success: true,
      listings: listings.map(listingView),
      filters: { q: search || undefined, category: category || undefined, condition, minPrice, maxPrice, status, sort },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const getListing = async (req, res, next) => {
  try {
    res.json({ success: true, listing: listingView(await getListingOrThrow(req.params.listingId)) });
  } catch (error) {
    next(error);
  }
};

const updateListing = async (req, res, next) => {
  try {
    const fields = validateListingFields(req.body);
    if (!Object.keys(fields).length) {
      const error = new Error(`Provide at least one field to update: ${allowedFields.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }
    const listing = await getListingOrThrow(req.params.listingId);
    ensureOwner(listing, req.user._id);
    Object.assign(listing, fields);
    await listing.save();
    res.json({ success: true, message: 'Listing updated successfully.', listing: listingView(listing) });
  } catch (error) {
    next(error);
  }
};

const uploadListingImages = async (req, res, next) => {
  try {
    const listing = await getListingOrThrow(req.params.listingId);
    ensureOwner(listing, req.user._id);
    if (!req.files?.length) {
      const error = new Error('Upload at least one image using the images field.');
      error.statusCode = 400;
      throw error;
    }
    if (listing.images.length + req.files.length > 5) {
      const error = new Error('A listing can have at most 5 images.');
      error.statusCode = 400;
      throw error;
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    listing.images.push(...req.files.map((file) => ({ url: `${baseUrl}/uploads/${file.filename}`, filename: file.filename })));
    await listing.save();
    res.status(201).json({ success: true, message: 'Images uploaded successfully.', listing: listingView(listing) });
  } catch (error) {
    await removeUploadedFiles(req.files);
    next(error);
  }
};

const markListingSold = async (req, res, next) => {
  try {
    const listing = await getListingOrThrow(req.params.listingId);
    ensureOwner(listing, req.user._id);
    if (listing.status === 'sold') {
      const error = new Error('This listing is already marked as sold.');
      error.statusCode = 400;
      throw error;
    }
    listing.status = 'sold';
    await listing.save();
    res.json({ success: true, message: 'Listing marked as sold.', listing: listingView(listing) });
  } catch (error) {
    next(error);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const listing = await getListingOrThrow(req.params.listingId);
    ensureOwner(listing, req.user._id);
    await listing.deleteOne();
    await removeUploadedFiles(listing.images);
    res.json({ success: true, message: 'Listing deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createListing, getListings, getListing, updateListing, uploadListingImages, markListingSold, deleteListing };
