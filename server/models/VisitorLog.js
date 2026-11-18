const mongoose = require('mongoose');

const visitorLogSchema = new mongoose.Schema(
  {
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    residentName: { type: String, required: true, trim: true },
    flatNumber: { type: String, required: true, trim: true },
    visitorName: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: ['Guest', 'Delivery'], required: true },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    vehicleNumber: { type: String, trim: true, uppercase: true, maxlength: 30, default: '' },
    purpose: { type: String, trim: true, maxlength: 250, default: '' },
    expectedAt: { type: Date, required: true },
    status: { type: String, enum: ['Expected', 'Checked In', 'Checked Out', 'Cancelled'], default: 'Expected' },
    entryAt: { type: Date, default: null },
    exitAt: { type: Date, default: null },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

visitorLogSchema.index({ residentId: 1, expectedAt: -1 });
visitorLogSchema.index({ status: 1, expectedAt: 1 });

module.exports = mongoose.model('VisitorLog', visitorLogSchema);
