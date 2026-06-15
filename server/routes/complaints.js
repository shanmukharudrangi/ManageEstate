const express = require('express');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

const getAuthenticatedUserId = (req) => req.user.userId || req.user.id;

// POST /api/complaints - Resident submits a complaint
router.post('/', authMiddleware, async (req, res) => {
  try {
    const residentId = getAuthenticatedUserId(req);

    if (!residentId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const resident = await User.findById(residentId).select('name apartment role');

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found.' });
    }

    if (resident.role !== 'resident') {
      return res.status(403).json({ message: 'Only residents can submit complaints.' });
    }

    const { category, title, description, priority } = req.body;

    const complaint = new Complaint({
      residentId,
      residentName: req.user.residentName || req.user.name || resident.name,
      flatNumber: req.user.flatNumber || req.user.apartment || resident.apartment,
      category,
      title,
      description,
      priority
    });

    await complaint.save();

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/complaints/my - Fetch resident complaints
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const residentId = getAuthenticatedUserId(req);
    const complaints = await Complaint.find({ residentId }).sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/complaints/all - Admin fetches all complaints
router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/complaints/:id/status - Admin updates complaint status
router.put('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const update = {
      status,
      adminNote
    };

    if (status === 'Resolved') {
      update.resolvedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/complaints/:id - Resident deletes own open complaint
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'resident') {
      return res.status(403).json({ message: 'Only residents can delete complaints.' });
    }

    const residentId = getAuthenticatedUserId(req);
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (complaint.residentId.toString() !== residentId) {
      return res.status(403).json({ message: 'You can only delete your own complaints.' });
    }

    if (complaint.status !== 'Open') {
      return res.status(400).json({ message: 'Only open complaints can be deleted.' });
    }

    await complaint.deleteOne();

    res.json({ message: 'Complaint deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
