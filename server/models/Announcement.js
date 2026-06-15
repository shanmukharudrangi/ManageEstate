const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 1000 },
    category: {
      type: String,
      enum: ['General', 'Maintenance', 'Meeting', 'Emergency', 'Event'],
      default: 'General',
    },
    isPinned: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
