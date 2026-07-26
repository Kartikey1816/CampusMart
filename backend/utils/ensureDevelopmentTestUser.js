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
    { title: 'Casio fx-991ES Plus Calculator', description: 'Genuine scientific calculator in excellent condition with protective hard case.', price: 650, category: 'Electronics', condition: 'like-new', pickupLocation: 'Central Library', images: [{ url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80' }] },
    { title: 'Engineering Mathematics by B.S. Grewal', description: 'Latest edition with a few neatly highlighted pages for first-year students.', price: 280, category: 'Books', condition: 'good', pickupLocation: 'Academic Block A', images: [{ url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=900&q=80' }] },
    { title: 'Study Desk Lamp', description: 'Adjustable LED desk lamp with three brightness settings, used for one semester.', price: 450, category: 'Hostel', condition: 'like-new', pickupLocation: 'Girls Hostel Gate', images: [{ url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80' }] },
    { title: 'Bluetooth Headphones', description: 'Comfortable wireless headphones with clear sound, long battery life, and charging cable.', price: 1100, category: 'Electronics', condition: 'good', pickupLocation: 'Student Activity Centre', images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80' }] },
    { title: 'Roadster Backpack', description: 'Spacious everyday backpack with a laptop sleeve, clean and structurally sound.', price: 500, category: 'Fashion', condition: 'fair', pickupLocation: 'Main Gate', images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80' }] },
    { title: 'Campus Hybrid Cycle', description: 'Recently serviced hybrid cycle that is smooth and ready for campus rides.', price: 3200, category: 'Sports', condition: 'good', pickupLocation: 'Boys Hostel Parking', images: [{ url: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=80' }] },
    { title: 'Computer Networks Notes', description: 'Organised handwritten notes with solved examples and important questions.', price: 120, category: 'Books', condition: 'like-new', pickupLocation: 'CSE Department', images: [{ url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80' }] },
    { title: '27-inch Monitor Stand', description: 'Minimal monitor riser that creates useful desk space below your screen.', price: 700, category: 'Hostel', condition: 'good', pickupLocation: 'Library Café', images: [{ url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80' }] },
    { title: 'Resistance Bands Set', description: 'Five resistance bands with handles and a door anchor, barely used and clean.', price: 250, category: 'Sports', condition: 'like-new', pickupLocation: 'Sports Complex', images: [{ url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=900&q=80' }] }
  ];

  await Promise.all(listings.map((listing) => Listing.findOneAndUpdate(
    { title: listing.title, seller: seller._id },
    { $set: { ...listing, status: 'available' }, $setOnInsert: { seller: seller._id } },
    { upsert: true, new: true }
  )));
  console.log(`Development listings ready: ${listings.length} sample listings`);
};

module.exports = { ensureDevelopmentTestUser, ensureDevelopmentFixtures, getTestEmail };
