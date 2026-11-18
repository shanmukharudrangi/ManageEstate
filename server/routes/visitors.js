const express = require('express');
const VisitorLog = require('../models/VisitorLog');
const User = require('../models/User');
const { authMiddleware, securityOnly } = require('../middleware/auth');

const router = express.Router();
const getUserId = (req) => req.user.userId || req.user.id;
const TYPES = ['Guest', 'Delivery'];

function validDate(value) {
  return value && !Number.isNaN(new Date(value).getTime());
}

// Residents pre-approve a guest or delivery expected at their flat.
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'resident') {
      return res.status(403).json({ message: 'Only residents can pre-approve visitors.' });
    }

    const { visitorName, type, phone = '', vehicleNumber = '', purpose = '', expectedAt } = req.body;
    if (!visitorName?.trim() || !TYPES.includes(type) || !validDate(expectedAt)) {
      return res.status(400).json({ message: 'Visitor name, type, and a valid expected time are required.' });
    }

    const resident = await User.findById(getUserId(req)).select('name apartment role status');
    if (!resident || resident.role !== 'resident' || resident.status !== 'active') {
      return res.status(403).json({ message: 'An active resident account is required.' });
    }

    const log = await VisitorLog.create({
      residentId: resident._id,
      residentName: resident.name,
      flatNumber: resident.apartment || 'Not provided',
      visitorName: visitorName.trim(),
      type,
      phone: phone.trim(),
      vehicleNumber: vehicleNumber.trim(),
      purpose: purpose.trim(),
      expectedAt: new Date(expectedAt),
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// A resident can only view their own visitor passes.
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const logs = await VisitorLog.find({ residentId: getUserId(req) }).sort({ expectedAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Security personnel use this as the gate register.
router.get('/', authMiddleware, securityOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const logs = await VisitorLog.find(filter).sort({ expectedAt: -1 }).limit(200);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/check-in', authMiddleware, securityOnly, async (req, res) => {
  try {
    const log = await VisitorLog.findOneAndUpdate(
      { _id: req.params.id, status: 'Expected' },
      { $set: { status: 'Checked In', entryAt: new Date(), handledBy: getUserId(req) } },
      { new: true, runValidators: true }
    );
    if (!log) return res.status(400).json({ message: 'Only expected visitors can be checked in.' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/check-out', authMiddleware, securityOnly, async (req, res) => {
  try {
    const log = await VisitorLog.findOneAndUpdate(
      { _id: req.params.id, status: 'Checked In' },
      { $set: { status: 'Checked Out', exitAt: new Date(), handledBy: getUserId(req) } },
      { new: true, runValidators: true }
    );
    if (!log) return res.status(400).json({ message: 'Only checked-in visitors can be checked out.' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'resident') return res.status(403).json({ message: 'Only residents can cancel a pass.' });
    const log = await VisitorLog.findOneAndUpdate(
      { _id: req.params.id, residentId: getUserId(req), status: 'Expected' },
      { $set: { status: 'Cancelled' } },
      { new: true, runValidators: true }
    );
    if (!log) return res.status(400).json({ message: 'Only your expected visitors can be cancelled.' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
