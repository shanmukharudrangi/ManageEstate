const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['resident', 'admin', 'superadmin'],
    default: 'resident'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'rejected'],
    default: 'active'
  },
  adminRequestNote: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  apartment: {
    type: String,
    trim: true
  },
  joinCodeUsed: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function savePassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);
