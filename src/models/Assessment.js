const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedIndex: { type: Number, required: true, min: 0, max: 3 },
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    answers: [answerSchema],
    score: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    autoSubmitted: { type: Boolean, default: false },
    attempted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

assessmentSchema.index({ candidateId: 1 }, { unique: true }); // one attempt per candidate

module.exports = mongoose.model('Assessment', assessmentSchema);
