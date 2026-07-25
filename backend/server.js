require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const listingRoutes = require('./routes/listingRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const { ensureDevelopmentTestUser, ensureDevelopmentFixtures } = require('./utils/ensureDevelopmentTestUser');

const app = express();
const PORT = process.env.PORT || 5001;

const validateEnvironment = () => {
  const requiredVariables = ['MONGO_URI', 'JWT_SECRET', 'ALLOWED_COLLEGE_EMAIL_DOMAINS'];
  const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length) {
    throw new Error(`Missing required environment variable(s): ${missingVariables.join(', ')}`);
  }
};

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'College Marketplace API is running' });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    validateEnvironment();
    await connectDB();
    await ensureDevelopmentTestUser();
    await ensureDevelopmentFixtures();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
