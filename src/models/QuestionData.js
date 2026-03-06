const mongoose = require('mongoose');

const questionDataSchema = new mongoose.Schema(
  {
    text: { type: String, default: '' },
    options: { type: [String], default: [] },
    correctIndex: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuestionData', questionDataSchema);
