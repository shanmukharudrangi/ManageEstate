const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const seed = require('./seed');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/marketplace', require('./routes/marketplace.routes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/polls', require('./routes/polls'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/payments', require('./routes/payments'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Serve frontend build
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback - serve index.html for all non-API GET routes
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/society-maintenance';

async function startServer() {
  try {
    // Add options for automatic reconnection
    const options = {
      serverSelectionTimeoutMS: 5000,
    };
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
    // Handle sudden disconnects
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected! Attempting to reconnect...');
      mongoose.connect(MONGODB_URI, options).catch(err => console.log('Reconnection failed'));
    });
    // 2. Run the seed function automatically
    // We don't need to pass arguments if you design it carefully
    await seed(false); 
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
// Add this middleware in server.js before your routes
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database connection lost. Please refresh the page.' 
    });
  }
  next();
});
startServer();