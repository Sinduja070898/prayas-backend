const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema(
  {
    candidateId: { type: String, required: true, unique: true },
    candidateName: { type: String, default: '' },
    answers: { type: [Number], default: [] },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    timeTakenSeconds: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssessmentResult', assessmentResultSchema);
