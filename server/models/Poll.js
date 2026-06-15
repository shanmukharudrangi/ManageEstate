const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    description: { type: String, default: '' },
    options: [
      {
        text: { type: String, required: true },
        votes: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deadline: { type: Date, required: true },
    isAnonymous: { type: Boolean, default: false },
    status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Poll', pollSchema);
