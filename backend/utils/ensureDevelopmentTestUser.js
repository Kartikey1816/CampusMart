const User = require('../models/User');
const Listing = require('../models/Listing');

const getTestEmail = () => {
  if (process.env.DEV_TEST_EMAIL) return process.env.DEV_TEST_EMAIL.trim().toLowerCase();
  const domain = (process.env.ALLOWED_COLLEGE_EMAIL_DOMAINS || 'college.edu')
    .split(',')
    .map((item) => item.trim())
    .find(Boolean);
  return `admin@${domain}`;
};

const ensureDevelopmentTestUser = async () => {
  if (process.env.NODE_ENV === 'production') return;

  const email = getTestEmail();
  const password = process.env.DEV_TEST_PASSWORD || '12345678';
  let user = await User.findOne({ email }).select('+password');

  if (!user) user = new User({ name: 'Campus Admin', email, password, isEmailVerified: true });
  else {
    user.name = 'Campus Admin';
    user.password = password;
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
  }

  await user.save();
  console.log(`Development test account ready: admin / ${password}`);
  return user;
};

const ensureDevelopmentFixtures = async () => {
  if (process.env.NODE_ENV === 'production') return;

  const domain = getTestEmail().split('@')[1];
  const sellerEmail = `seller@${domain}`;
  let seller = await User.findOne({ email: sellerEmail }).select('+password');
  if (!seller) seller = new User({ name: 'Campus Seller', email: sellerEmail, password: '12345678', isEmailVerified: true });
  else {
    seller.name = 'Campus Seller';
    seller.isEmailVerified = true;
  }
  await seller.save();

  const listings = [
    { title: 'Casio fx-991ES Plus Calculator', description: 'Genuine scientific calculator in excellent condition with protective hard case.', price: 650, category: 'Electronics', condition: 'like-new', pickupLocation: 'Central Library' },
    { title: 'Engineering Mathematics by B.S. Grewal', description: 'Latest edition with a few neatly highlighted pages for first-year students.', price: 280, category: 'Books', condition: 'good', pickupLocation: 'Academic Block A' },
    { title: 'Study Desk Lamp', description: 'Adjustable LED desk lamp with three brightness settings, used for one semester.', price: 450, category: 'Hostel', condition: 'like-new', pickupLocation: 'Girls Hostel Gate' },
    { title: 'Campus Hybrid Cycle', description: 'Recently serviced hybrid cycle that is smooth and ready for campus rides.', price: 3200, category: 'Sports', condition: 'good', pickupLocation: 'Boys Hostel Parking' },
    { title: 'Roadster Backpack', description: 'Spacious everyday backpack with a laptop sleeve, clean and structurally sound.', price: 500, category: 'Fashion', condition: 'fair', pickupLocation: 'Main Gate' }
  ];

  await Promise.all(listings.map((listing) => Listing.findOneAndUpdate(
    { title: listing.title, seller: seller._id },
    { $setOnInsert: { ...listing, seller: seller._id, status: 'available' } },
    { upsert: true, new: true }
  )));
  console.log(`Development listings ready: ${listings.length} sample listings`);
};

module.exports = { ensureDevelopmentTestUser, ensureDevelopmentFixtures, getTestEmail };
