const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    residentName: {
      type: String,
      required: true,
      trim: true
    },
    flatNumber: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Lift', 'Water', 'Electricity', 'Parking', 'Cleanliness', 'Security', 'Other'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open'
    },
    adminNote: {
      type: String,
      default: '',
      trim: true
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Complaint', complaintSchema);
