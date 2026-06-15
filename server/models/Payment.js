const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    residentName: { type: String, required: true },
    flatNumber: { type: String, required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
    paidOn: { type: Date, default: null },
    method: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'], default: 'Cash' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
