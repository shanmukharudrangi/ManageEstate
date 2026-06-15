const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { evaluatePassword, getPasswordErrorMessage } = require('../utils/passwordValidation');

const normalizeEmail = (email = '') => email.trim().toLowerCase();

function createToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role, status: user.status, name: user.name, apartment: user.apartment || '' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
}

exports.signup = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const role = req.body.role || 'resident';
    const apartment = req.body.apartment?.trim();
    const rawNote = req.body.adminRequestNote?.trim() || '';
    const adminRequestNote = rawNote.slice(0, 200);
    const joinCode = req.body.joinCode || '';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (role === 'superadmin') {
      return res.status(403).json({ message: 'Super admin cannot be created via signup.' });
    }

    if (!['admin', 'resident'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    if (role === 'resident') {
      if (!joinCode) {
        return res.status(400).json({ message: 'Society join code is required for residents.' });
      }
      if (joinCode !== (process.env.SOCIETY_JOIN_CODE || 'SUNSHINE2026')) {
        return res.status(403).json({ message: 'Invalid join code. Contact your society admin.' });
      }
    }

    const passwordValidation = evaluatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: getPasswordErrorMessage(passwordValidation),
        passwordRules: passwordValidation.rules
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const isAdmin = role === 'admin';

    const user = new User({
      name,
      email,
      password,
      role,
      apartment,
      status: isAdmin ? 'pending' : 'active',
      adminRequestNote: isAdmin ? adminRequestNote : '',
      joinCodeUsed: role === 'resident' ? joinCode : ''
    });

    await user.save();

    if (isAdmin) {
      return res.status(201).json({
        message: 'Admin request submitted. Awaiting super admin approval.',
        pendingApproval: true
      });
    }

    res.status(201).json({
      message: 'User created successfully.',
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        apartment: user.apartment || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Your admin request is under review. Please wait for approval.'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        message: `Your admin request was rejected. Reason: ${user.rejectionReason || 'Contact support.'}`
      });
    }

    res.json({
      message: 'Login successful.',
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        apartment: user.apartment || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
