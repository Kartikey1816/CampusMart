const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, immutable: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 }
  },
  { timestamps: true }
);

reviewSchema.index({ listing: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
