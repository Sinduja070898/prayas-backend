const mongoose = require('mongoose');

const STATUS = [
  'Registered',
  'Submitted',
  'Shortlisted',
  'Not_Shortlisted',
  'Assessment_Pending',
  'Assessment_Submitted',
];

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    homeState: { type: String, trim: true },
    assemblyConstituency: { type: String, trim: true }, // Punjab only
    currentState: { type: String, trim: true },
    category: { type: String, trim: true }, // General / OBC / SC / ST / Prefer not to say
    qualification: { type: String, trim: true },
    discipline: { type: String, trim: true },
    currentlyEnrolled: { type: Boolean },
    currentYear: { type: String, trim: true },
    collegeName: { type: String, trim: true },
    resumeUrl: { type: String, trim: true }, // Cloudinary URL
    status: { type: String, enum: STATUS, default: 'Registered' },
    commitHours: { type: Boolean },
    hasLaptop: { type: Boolean },
    openToField: { type: Boolean },
    willingINC: { type: Boolean },
    punjabiProficiency: { type: String, trim: true },
    whyInterested: { type: String, trim: true }, // max 100 words enforced in validation
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1 }, { unique: true });
applicationSchema.index({ status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
module.exports.STATUS = STATUS;
