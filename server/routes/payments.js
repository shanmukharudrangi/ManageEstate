const express = require('express');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
const getUserId = (req) => req.user.userId || req.user.id;
const VALID_STATUSES = ['Paid', 'Pending', 'Overdue'];
const VALID_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];
const isValidMonth = (month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month || '');

// POST /api/payments/mark — admin creates or updates a payment record
router.post('/mark', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { residentId, month, amount, status = 'Pending', method = 'Cash', note = '' } = req.body;
    const numericAmount = Number(amount);

    if (!residentId || !month || amount === undefined) {
      return res.status(400).json({ message: 'residentId, month, and amount are required.' });
    }
    if (!isValidMonth(month)) {
      return res.status(400).json({ message: 'month must be in YYYY-MM format.' });
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number.' });
    }
    if (!VALID_STATUSES.includes(status) || !VALID_METHODS.includes(method)) {
      return res.status(400).json({ message: 'Invalid payment status or method.' });
    }

    const resident = await User.findOne({ _id: residentId, role: 'resident', status: 'active' })
      .select('name apartment');
    if (!resident) {
      return res.status(404).json({ message: 'Active resident not found.' });
    }

    const update = {
      residentName: resident.name,
      flatNumber: resident.apartment || '',
      amount: numericAmount,
      status,
      method,
      note: typeof note === 'string' ? note.trim().slice(0, 500) : '',
      paidOn: status === 'Paid' ? new Date() : null,
    };
    const payment = await Payment.findOneAndUpdate(
      { residentId, month },
      { $set: { ...update, residentId, month } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
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
    if (!isValidMonth(month)) return res.status(400).json({ message: 'month query param must be YYYY-MM.' });
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
    if (!isValidMonth(month)) return res.status(400).json({ message: 'month must be YYYY-MM.' });
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
