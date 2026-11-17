// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed(shouldDisconnect = true) {
  try {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
    }

    const existing = await User.findOne({ role: 'superadmin' });

    if (existing) {
      console.log('Super admin already exists:', existing.email);
      return;
    }

    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@manageestate.com';
    const rawPassword = process.env.SUPERADMIN_PASSWORD;

    if (!rawPassword) {
      throw new Error('SUPERADMIN_PASSWORD must be set before the first server start.');
    }

    await User.create({
      name: 'Super Admin',
      email,
      password: rawPassword,
      role: 'superadmin',
      status: 'active',
      apartment: 'N/A'
    });

    console.log('Super admin created successfully:', email);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    if (shouldDisconnect) {
        await mongoose.disconnect();
    }
  }
}
module.exports = seed;
