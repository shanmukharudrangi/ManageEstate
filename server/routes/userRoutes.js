const express = require('express');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/residents — admin/superadmin only
// Returns all active residents for dropdown use in payment forms
router.get('/residents', authMiddleware, adminOnly, async (req, res) => {
  try {
    const residents = await User.find({ role: 'resident', status: 'active' })
      .select('_id name apartment')
      .sort({ apartment: 1 });
    res.json(residents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
