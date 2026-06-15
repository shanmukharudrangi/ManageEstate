const express = require('express');
const Announcement = require('../models/Announcement');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
const getUserId = (req) => req.user.userId || req.user.id;

// POST /api/announcements — admin creates
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, content, category, isPinned, expiresAt } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }
    const announcement = await Announcement.create({
      title,
      content,
      category: category || 'General',
      isPinned: !!isPinned,
      createdBy: getUserId(req),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    await announcement.populate('createdBy', 'name');
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/announcements — all authenticated, filters expired, pinned first
router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .populate('createdBy', 'name')
      .sort({ isPinned: -1, createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/announcements/:id/pin — admin toggles pin
router.put('/:id/pin', authMiddleware, adminOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
    announcement.isPinned = !announcement.isPinned;
    await announcement.save();
    await announcement.populate('createdBy', 'name');
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/announcements/:id — admin deletes
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
