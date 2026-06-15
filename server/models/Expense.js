const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    trim: true,
    match: /^\d{4}-\d{2}$/
  },
  expenses: [
    {
      category: {
        type: String,
        enum: ['Staff Salary', 'Repairs & Maintenance', 'Utilities', 'Reserve Fund', 'Other'],
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      description: {
        type: String,
        trim: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
