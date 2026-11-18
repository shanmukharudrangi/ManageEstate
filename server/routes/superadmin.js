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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
      { status: 'pending', role: { $in: ['admin', 'security'] } },
      '_id name email apartment role adminRequestNote createdAt'
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

    if (!['admin', 'security'].includes(user.role) || user.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending admin or security requests can be approved.' });
    }

    user.status = 'active';
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

    if (!['admin', 'security'].includes(user.role) || user.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending admin or security requests can be rejected.' });
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

router.get('/all-staff', requireSuperAdmin, async (req, res) => {
  try {
    const staff = await User.find(
      { role: { $in: ['admin', 'security'] }, status: 'active' },
      '_id name email apartment role createdAt'
    );

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
