const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  getApplications,
  getApplicationByUserId,
  getApplicationById,
  saveApplication,
  updateApplicationStatus,
} = require('../store');

const VALID_STATUSES = ['Shortlisted', 'Not Shortlisted', 'Assessment Pending', 'Assessment Submitted', 'Application Submitted', 'Registered'];

// POST /api/applications — Candidate: submit application
router.post('/', auth, requireRole('candidate'), async (req, res) => {
  const userId = req.user.userId;
  const formData = req.body;
  const app = await saveApplication(userId, formData);
  res.status(201).json({ message: 'Application submitted', application: app });
});

// GET /api/applications/me — Candidate: my application + status
router.get('/me', auth, requireRole('candidate'), async (req, res) => {
  const userId = req.user.userId;
  const app = await getApplicationByUserId(userId);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  res.json(app);
});

// GET /api/applications — Admin: all applications
router.get('/', auth, requireRole('admin'), async (req, res) => {
  const { status, search } = req.query;
  let list = await getApplications();
  if (status) list = list.filter((a) => a.status === status);
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    list = list.filter(
      (a) =>
        (a.formData && (a.formData.fullName || '').toLowerCase().includes(s)) ||
        (a.formData && (a.formData.email || '').toLowerCase().includes(s))
    );
  }
  res.json({ applications: list, total: list.length });
});

// GET /api/applications/:id — Admin: single application
router.get('/:id', auth, requireRole('admin'), async (req, res) => {
  const app = await getApplicationById(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  res.json(app);
});

// PUT /api/applications/:id/status — Admin: update status
router.put('/:id/status', auth, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const app = await updateApplicationStatus(req.params.id, status);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  res.json({ message: 'Status updated', application: app });
});

module.exports = router;
