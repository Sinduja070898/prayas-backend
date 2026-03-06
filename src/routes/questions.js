const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  getQuestions,
  getQuestionById,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../store');

// POST /api/questions — Admin: create question
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { text, options, correctIndex } = req.body;
  if (!text || !Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ error: 'text and options (length 4) required' });
  }
  const idx = typeof correctIndex === 'number' ? correctIndex : parseInt(correctIndex, 10);
  if (isNaN(idx) || idx < 0 || idx > 3) {
    return res.status(400).json({ error: 'correctIndex must be 0-3' });
  }
  const question = await addQuestion({ text, options, correctIndex: idx });
  res.status(201).json({ message: 'Question created', question });
});

// GET /api/questions — Candidate: all questions (no correctIndex)
router.get('/', auth, requireRole('candidate'), async (req, res) => {
  const questions = await getQuestions(false);
  res.json({ questions });
});

// GET /api/questions/admin — Admin: all questions (with correctIndex)
router.get('/admin', auth, requireRole('admin'), async (req, res) => {
  const questions = await getQuestions(true);
  res.json({ questions });
});

// PUT /api/questions/:id — Admin: update question
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  const question = await updateQuestion(req.params.id, req.body);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json({ message: 'Question updated', question });
});

// DELETE /api/questions/:id — Admin: delete question
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  const ok = await deleteQuestion(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Question not found' });
  res.status(204).send();
});

module.exports = router;
