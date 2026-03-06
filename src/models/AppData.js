const mongoose = require('mongoose');

const appDataSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    formData: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, default: 'Application Submitted' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppData', appDataSchema);
