const express = require('express');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
const getUserId = (req) => req.user.userId || req.user.id;

// POST /api/payments/mark — admin creates or updates a payment record
router.post('/mark', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { residentId, residentName, flatNumber, month, amount, status, method, note } = req.body;
    if (!residentId || !month || !amount) {
      return res.status(400).json({ message: 'residentId, month, and amount are required.' });
    }
    const update = {
      residentName,
      flatNumber,
      amount,
      status: status || 'Pending',
      method: method || 'Cash',
      note: note || '',
      paidOn: status === 'Paid' ? new Date() : null,
    };
    const payment = await Payment.findOneAndUpdate(
      { residentId, month },
      { $set: { ...update, residentId, month } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/all?month=YYYY-MM — admin views all payments for a month
router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: 'month query param required (YYYY-MM).' });
    const payments = await Payment.find({ month }).populate('residentId', 'name apartment').sort({ flatNumber: 1 });
    const totalCollected = payments
      .filter((p) => p.status === 'Paid')
      .reduce((s, p) => s + p.amount, 0);
    const pendingCount = payments.filter((p) => p.status !== 'Paid').length;
    res.json({ payments, totalCollected, pendingCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/my — resident views own payment history
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const payments = await Payment.find({ residentId: userId }).sort({ month: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/summary/:month — admin gets summary stats
router.get('/summary/:month', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { month } = req.params;
    const [payments, totalResidents] = await Promise.all([
      Payment.find({ month }),
      User.countDocuments({ role: 'resident', status: 'active' }),
    ]);
    const paid = payments.filter((p) => p.status === 'Paid').length;
    const pending = payments.filter((p) => p.status === 'Pending').length;
    const overdue = payments.filter((p) => p.status === 'Overdue').length;
    const totalCollected = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
    const pendingAmount = payments.filter((p) => p.status !== 'Paid').reduce((s, p) => s + p.amount, 0);
    res.json({ totalResidents, paid, pending, overdue, totalCollected, pendingAmount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
