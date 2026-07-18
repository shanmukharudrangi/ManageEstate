const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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

// SPA fallback - serve index.html for all non-API routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/society-maintenance';

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

startServer();