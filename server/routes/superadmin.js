const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  const authorizationHeader = req.headers.authorization || '';

  if (!authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = authorizationHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Super admin access required.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

router.get('/pending', requireSuperAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find(
      { status: 'pending' },
      '_id name email apartment adminRequestNote createdAt'
    ).sort({ createdAt: 1 });

    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/approve/:userId', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.status = 'active';
    user.role = 'admin';
    await user.save();

    res.json({
      message: 'Approved',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/reject/:userId', requireSuperAdmin, async (req, res) => {
  try {
    const reason = req.body.reason || 'Request denied by super admin';

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.status = 'rejected';
    user.rejectionReason = reason;
    await user.save();

    res.json({
      message: 'Rejected',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        rejectionReason: user.rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/all-admins', requireSuperAdmin, async (req, res) => {
  try {
    const admins = await User.find(
      { role: 'admin', status: 'active' },
      '_id name email apartment createdAt'
    );

    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
