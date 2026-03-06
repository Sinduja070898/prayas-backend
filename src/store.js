const mongoose = require('mongoose');
const storeDb = require('./storeDb');

function useDb() {
  return process.env.MONGODB_URI && mongoose.connection.readyState === 1;
}

const users = [];
const applications = [];
const questions = [];
const assessments = [];
let userIdSeq = 1, applicationIdSeq = 1, questionIdSeq = 1, assessmentIdSeq = 1;

function getUsersMem() { return users; }
function getUserByEmailMem(email) {
  const e = (email || '').trim().toLowerCase();
  return users.find((u) => (u.email || '').toLowerCase() === e) || null;
}
function createUserMem(data) {
  const { email, name, password, role = 'candidate' } = data;
  const user = { id: 'u-' + userIdSeq++, email: (email || '').trim().toLowerCase(), name: (name || '').trim() || (email || '').split('@')[0], password: password || '', role, createdAt: new Date().toISOString() };
  users.push(user);
  return user;
}
function getApplicationsMem() { return applications; }
function getApplicationByUserIdMem(userId) { return applications.find((a) => String(a.userId) === String(userId)) || null; }
function getApplicationByIdMem(id) { return applications.find((a) => String(a.id) === String(id)) || null; }
function saveApplicationMem(userId, formData) {
  const existing = getApplicationByUserIdMem(userId);
  const payload = { formData: formData || {}, status: 'Application Submitted', submittedAt: new Date().toISOString() };
  if (existing) { Object.assign(existing, payload); return existing; }
  const newApp = { id: 'app-' + applicationIdSeq++, userId: String(userId), ...payload };
  applications.push(newApp);
  return newApp;
}
function updateApplicationStatusMem(id, status) {
  const app = getApplicationByIdMem(id);
  if (!app) return null;
  app.status = status;
  return app;
}
function updateApplicationStatusByUserIdMem(userId, status) {
  const app = getApplicationByUserIdMem(userId);
  if (!app) return null;
  app.status = status;
  return app;
}
function getQuestionsMem(includeCorrect) {
  const list = includeCorrect ? questions : questions.filter((q) => q.isActive !== false);
  return list.map((q) => {
    const { id, text, options, correctIndex, isActive } = q;
    if (includeCorrect) return { id, text, options, correctIndex, isActive };
    return { id, text, options };
  });
}
function getQuestionByIdMem(id) { return questions.find((q) => String(q.id) === String(id)) || null; }
function addQuestionMem(data) {
  const q = { id: 'q-' + questionIdSeq++, text: data.text || '', options: Array.isArray(data.options) ? data.options : [], correctIndex: typeof data.correctIndex === 'number' ? data.correctIndex : 0, isActive: true };
  questions.push(q);
  return q;
}
function updateQuestionMem(id, data) {
  const q = getQuestionByIdMem(id);
  if (!q) return null;
  if (data.text !== undefined) q.text = data.text;
  if (data.options !== undefined) q.options = data.options;
  if (data.correctIndex !== undefined) q.correctIndex = data.correctIndex;
  if (data.isActive !== undefined) q.isActive = data.isActive;
  return q;
}
function deleteQuestionMem(id) {
  const i = questions.findIndex((q) => String(q.id) === String(id));
  if (i === -1) return false;
  questions.splice(i, 1);
  return true;
}
function getAssessmentsMem() { return assessments; }
function getAssessmentByCandidateIdMem(candidateId) { return assessments.find((a) => String(a.candidateId) === String(candidateId)) || null; }
function saveAssessmentMem(candidateId, candidateName, answersArray, timeTakenSeconds) {
  if (getAssessmentByCandidateIdMem(candidateId)) return getAssessmentByCandidateIdMem(candidateId);
  const qList = questions.filter((q) => q.isActive !== false);
  let score = 0;
  (answersArray || []).forEach((val, i) => { if (qList[i] && val === qList[i].correctIndex) score++; });
  const assessment = { id: 'res-' + assessmentIdSeq++, candidateId: String(candidateId), candidateName: candidateName || '', answers: answersArray || [], score, total: qList.length, submittedAt: new Date().toISOString(), timeTakenSeconds: timeTakenSeconds || null };
  assessments.push(assessment);
  return assessment;
}

async function getUsers() { return useDb() ? storeDb.getUsers() : getUsersMem(); }
async function getUserByEmail(email) { return useDb() ? storeDb.getUserByEmail(email) : getUserByEmailMem(email); }
async function createUser(data) { return useDb() ? storeDb.createUser(data) : createUserMem(data); }
async function getApplications() { return useDb() ? storeDb.getApplications() : getApplicationsMem(); }
async function getApplicationByUserId(userId) { return useDb() ? storeDb.getApplicationByUserId(userId) : getApplicationByUserIdMem(userId); }
async function getApplicationById(id) { return useDb() ? storeDb.getApplicationById(id) : getApplicationByIdMem(id); }
async function saveApplication(userId, formData) { return useDb() ? storeDb.saveApplication(userId, formData) : saveApplicationMem(userId, formData); }
async function updateApplicationStatus(id, status) { return useDb() ? storeDb.updateApplicationStatus(id, status) : updateApplicationStatusMem(id, status); }
async function updateApplicationStatusByUserId(userId, status) { return useDb() ? storeDb.updateApplicationStatusByUserId(userId, status) : updateApplicationStatusByUserIdMem(userId, status); }
async function getQuestions(includeCorrect = false) { return useDb() ? storeDb.getQuestions(includeCorrect) : getQuestionsMem(includeCorrect); }
async function getQuestionById(id) { return useDb() ? storeDb.getQuestionById(id) : getQuestionByIdMem(id); }
async function addQuestion(data) { return useDb() ? storeDb.addQuestion(data) : addQuestionMem(data); }
async function updateQuestion(id, data) { return useDb() ? storeDb.updateQuestion(id, data) : updateQuestionMem(id, data); }
async function deleteQuestion(id) { return useDb() ? storeDb.deleteQuestion(id) : deleteQuestionMem(id); }
async function getAssessments() { return useDb() ? storeDb.getAssessments() : getAssessmentsMem(); }
async function getAssessmentByCandidateId(candidateId) { return useDb() ? storeDb.getAssessmentByCandidateId(candidateId) : getAssessmentByCandidateIdMem(candidateId); }
async function saveAssessment(candidateId, candidateName, answersArray, timeTakenSeconds) { return useDb() ? storeDb.saveAssessment(candidateId, candidateName, answersArray, timeTakenSeconds) : saveAssessmentMem(candidateId, candidateName, answersArray, timeTakenSeconds); }

module.exports = {
  getUsers, getUserByEmail, createUser,
  getApplications, getApplicationByUserId, getApplicationById, saveApplication, updateApplicationStatus, updateApplicationStatusByUserId,
  getQuestions, getQuestionById, addQuestion, updateQuestion, deleteQuestion,
  getAssessments, getAssessmentByCandidateId, saveAssessment,
};
