require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);

    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@manageestate.com';
    const rawPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026';

    const existing = await User.findOne({ role: 'superadmin' });

    if (existing) {
      existing.password = rawPassword;
      await existing.save();
      console.log('Super admin password reset successfully:', existing.email);
      await mongoose.disconnect();
      return;
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
    await mongoose.disconnect();
  }
}
module.exports = seed;