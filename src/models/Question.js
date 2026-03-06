const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4 && v.every((o) => typeof o === 'string' && o.trim()),
        message: 'options must be an array of exactly 4 non-empty strings',
      },
    },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // admin
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
