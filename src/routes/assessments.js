const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  getQuestions,
  getApplicationByUserId,
  getAssessments,
  getAssessmentByCandidateId,
  saveAssessment,
  updateApplicationStatusByUserId,
} = require('../store');

const SHORTLISTED_STATUSES = ['Shortlisted', 'Assessment Pending'];

// POST /api/assessments/start — Candidate: start assessment
router.post('/start', auth, requireRole('candidate'), async (req, res) => {
  const userId = req.user.userId;
  const app = await getApplicationByUserId(userId);
  if (!app || !SHORTLISTED_STATUSES.includes(app.status)) {
    return res.status(403).json({ error: 'Not eligible for assessment' });
  }
  const existing = await getAssessmentByCandidateId(userId);
  if (existing) {
    return res.status(400).json({ error: 'Assessment already attempted' });
  }
  const questions = await getQuestions(false);
  res.json({
    assessmentId: null,
    questions: questions.map((q) => ({ id: q.id, text: q.text, options: q.options })),
    startedAt: new Date().toISOString(),
  });
});

// POST /api/assessments/submit — Candidate: submit answers
router.post('/submit', auth, requireRole('candidate'), async (req, res) => {
  const userId = req.user.userId;
  const { answers, timeTakenSeconds } = req.body;
  const app = await getApplicationByUserId(userId);
  if (!app || !SHORTLISTED_STATUSES.includes(app.status)) {
    return res.status(403).json({ error: 'Not eligible' });
  }
  const existing = await getAssessmentByCandidateId(userId);
  if (existing) {
    return res.status(400).json({ error: 'Already submitted' });
  }
  const answerArray = Array.isArray(answers) ? answers : [];
  const assessment = await saveAssessment(userId, req.user.email || 'Candidate', answerArray, timeTakenSeconds);
  await updateApplicationStatusByUserId(userId, 'Assessment Submitted');
  res.json({
    score: assessment.score,
    totalQuestions: assessment.total,
    submittedAt: assessment.submittedAt,
  });
});

// GET /api/assessments/me — Candidate: my result
router.get('/me', auth, requireRole('candidate'), async (req, res) => {
  const result = await getAssessmentByCandidateId(req.user.userId);
  if (!result) return res.status(404).json({ error: 'No assessment result found' });
  res.json(result);
});

// GET /api/assessments — Admin: all results
router.get('/', auth, requireRole('admin'), async (req, res) => {
  const list = await getAssessments();
  res.json({ assessments: list });
});

// GET /api/assessments/export — Admin: CSV
router.get('/export', auth, requireRole('admin'), async (req, res) => {
  const list = await getAssessments();
  const header = 'Candidate,Score,Total,Submitted\n';
  const rows = list.map((a) => `"${(a.candidateName || '').replace(/"/g, '""')}",${a.score},${a.total},"${a.submittedAt || ''}"`).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
  res.send(header + rows);
});

module.exports = router;
