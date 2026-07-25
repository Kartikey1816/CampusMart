const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    filename: { type: String, trim: true }
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [60, 'Category cannot exceed 60 characters']
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: ['new', 'like-new', 'good', 'fair'],
        message: 'Condition must be new, like-new, good, or fair.'
      }
    },
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
      maxlength: [120, 'Pickup location cannot exceed 120 characters']
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (images) => images.length <= 5,
        message: 'A listing can have at most 5 images.'
      }
    },
    status: {
      type: String,
      enum: ['available', 'sold'],
      default: 'available'
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true
    }
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', description: 'text', category: 'text' });
listingSchema.index({ seller: 1, status: 1, createdAt: -1 });
listingSchema.index({ status: 1, category: 1, condition: 1, price: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
