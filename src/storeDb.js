const mongoose = require('mongoose');
const User = require('./models/User');
const AppData = require('./models/AppData');
const QuestionData = require('./models/QuestionData');
const AssessmentResult = require('./models/AssessmentResult');

function toUser(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    email: o.email,
    name: o.name,
    password: o.password,
    role: o.role || 'candidate',
    createdAt: o.createdAt,
  };
}

async function getUsers() {
  const docs = await User.find().select('+password').lean();
  return docs.map((d) => ({ ...d, id: String(d._id) }));
}

async function getUserByEmail(email) {
  const e = (email || '').trim().toLowerCase();
  const doc = await User.findOne({ email: e }).select('+password').lean();
  return doc ? toUser({ ...doc, _id: doc._id }) : null;
}

async function createUser(data) {
  const { email, name, password, role = 'candidate' } = data;
  const doc = await User.create({
    email: (email || '').trim().toLowerCase(),
    name: (name || '').trim() || (email || '').split('@')[0],
    password: password || '',
    role,
  });
  const created = await User.findById(doc._id).select('+password').lean();
  return { id: String(created._id), email: created.email, name: created.name, password: created.password, role: created.role, createdAt: created.createdAt };
}

async function getApplications() {
  const docs = await AppData.find().lean();
  return docs.map((d) => ({ id: String(d._id), userId: d.userId, formData: d.formData || {}, status: d.status, submittedAt: d.submittedAt }));
}

async function getApplicationByUserId(userId) {
  const doc = await AppData.findOne({ userId: String(userId) }).lean();
  return doc ? { id: String(doc._id), userId: doc.userId, formData: doc.formData || {}, status: doc.status, submittedAt: doc.submittedAt } : null;
}

async function getApplicationById(id) {
  const doc = await AppData.findById(id).lean();
  return doc ? { id: String(doc._id), userId: doc.userId, formData: doc.formData || {}, status: doc.status, submittedAt: doc.submittedAt } : null;
}

async function saveApplication(userId, formData) {
  const existing = await AppData.findOne({ userId: String(userId) });
  const payload = { formData: formData || {}, status: 'Application Submitted', submittedAt: new Date() };
  if (existing) {
    await AppData.updateOne({ _id: existing._id }, payload);
    const updated = await AppData.findById(existing._id).lean();
    return { id: String(updated._id), userId: updated.userId, ...payload };
  }
  const doc = await AppData.create({ userId: String(userId), ...payload });
  return { id: String(doc._id), userId: String(userId), ...payload };
}

async function updateApplicationStatus(id, status) {
  const doc = await AppData.findByIdAndUpdate(id, { status }, { new: true }).lean();
  return doc ? { id: String(doc._id), userId: doc.userId, formData: doc.formData, status: doc.status, submittedAt: doc.submittedAt } : null;
}

async function updateApplicationStatusByUserId(userId, status) {
  const doc = await AppData.findOneAndUpdate({ userId: String(userId) }, { status }, { new: true }).lean();
  return doc ? { id: String(doc._id), userId: doc.userId, formData: doc.formData, status: doc.status, submittedAt: doc.submittedAt } : null;
}

async function getQuestions(includeCorrect = false) {
  const filter = includeCorrect ? {} : { isActive: { $ne: false } };
  const docs = await QuestionData.find(filter).lean();
  return docs.map((d) => {
    const q = { id: String(d._id), text: d.text, options: d.options || [] };
    if (includeCorrect) { q.correctIndex = d.correctIndex; q.isActive = d.isActive; }
    return q;
  });
}

async function getQuestionById(id) {
  const doc = await QuestionData.findById(id).lean();
  return doc ? { id: String(doc._id), text: doc.text, options: doc.options || [], correctIndex: doc.correctIndex, isActive: doc.isActive } : null;
}

async function addQuestion(data) {
  const doc = await QuestionData.create({
    text: data.text || '',
    options: Array.isArray(data.options) ? data.options : [],
    correctIndex: typeof data.correctIndex === 'number' ? data.correctIndex : 0,
    isActive: true,
  });
  return { id: String(doc._id), text: doc.text, options: doc.options, correctIndex: doc.correctIndex, isActive: doc.isActive };
}

async function updateQuestion(id, data) {
  const doc = await QuestionData.findByIdAndUpdate(id, {
    ...(data.text !== undefined && { text: data.text }),
    ...(data.options !== undefined && { options: data.options }),
    ...(data.correctIndex !== undefined && { correctIndex: data.correctIndex }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
  }, { new: true }).lean();
  return doc ? { id: String(doc._id), text: doc.text, options: doc.options, correctIndex: doc.correctIndex, isActive: doc.isActive } : null;
}

async function deleteQuestion(id) {
  const result = await QuestionData.findByIdAndDelete(id);
  return !!result;
}

async function getAssessments() {
  const docs = await AssessmentResult.find().lean();
  return docs.map((d) => ({
    id: String(d._id),
    candidateId: d.candidateId,
    candidateName: d.candidateName,
    answers: d.answers,
    score: d.score,
    total: d.total,
    submittedAt: d.submittedAt,
    timeTakenSeconds: d.timeTakenSeconds,
  }));
}

async function getAssessmentByCandidateId(candidateId) {
  const doc = await AssessmentResult.findOne({ candidateId: String(candidateId) }).lean();
  return doc ? { id: String(doc._id), candidateId: doc.candidateId, candidateName: doc.candidateName, answers: doc.answers, score: doc.score, total: doc.total, submittedAt: doc.submittedAt, timeTakenSeconds: doc.timeTakenSeconds } : null;
}

async function saveAssessment(candidateId, candidateName, answersArray, timeTakenSeconds) {
  const existing = await AssessmentResult.findOne({ candidateId: String(candidateId) });
  if (existing) return getAssessmentByCandidateId(candidateId);

  const questionDocs = await QuestionData.find({ isActive: { $ne: false } }).lean();
  let score = 0;
  const arr = answersArray || [];
  questionDocs.forEach((q, i) => {
    if (arr[i] !== undefined && arr[i] !== null && arr[i] === q.correctIndex) score++;
  });

  const doc = await AssessmentResult.create({
    candidateId: String(candidateId),
    candidateName: candidateName || '',
    answers: arr,
    score,
    total: questionDocs.length,
    submittedAt: new Date(),
    timeTakenSeconds: timeTakenSeconds || null,
  });
  return { id: String(doc._id), candidateId: String(candidateId), candidateName: doc.candidateName, answers: doc.answers, score: doc.score, total: doc.total, submittedAt: doc.submittedAt, timeTakenSeconds: doc.timeTakenSeconds };
}

module.exports = {
  getUsers,
  getUserByEmail,
  createUser,
  getApplications,
  getApplicationByUserId,
  getApplicationById,
  saveApplication,
  updateApplicationStatus,
  updateApplicationStatusByUserId,
  getQuestions,
  getQuestionById,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getAssessments,
  getAssessmentByCandidateId,
  saveAssessment,
};
