const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'College email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: undefined,
      maxlength: [2048, 'Avatar URL cannot exceed 2048 characters'],
      match: [/^https?:\/\/\S+$/i, 'Avatar must be a valid HTTP(S) URL']
    },
    hostel: {
      type: String,
      trim: true,
      maxlength: [80, 'Hostel cannot exceed 80 characters']
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters']
    },
    year: {
      type: Number,
      min: [1, 'Year must be between 1 and 8'],
      max: [8, 'Year must be between 1 and 8']
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    wishlist: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
      default: []
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchesPassword = function matchesPassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createEmailVerificationToken = function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 60 * 60 * 1000;
  return token;
};

userSchema.index({ wishlist: 1 });

module.exports = mongoose.model('User', userSchema);
