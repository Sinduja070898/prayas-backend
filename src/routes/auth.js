const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const { getUserByEmail, createUser } = require('../store');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password required' });
  }
  const existing = await getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists. Sign in instead.' });
  }
  const user = await createUser({ email, name, password, role: 'candidate' });
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: 'candidate' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.status(201).json({
    token,
    user: { _id: user.id, id: user.id, email: user.email, name: user.name, role: 'candidate' },
  });
});

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const r = (role || 'candidate').toLowerCase();

  if (r === 'admin') {
    return res.status(401).json({ error: 'No admin account found with this email.' });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'No account found with this email. Please register first.' });
  }
  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: 'candidate' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: { _id: user.id, id: user.id, email: user.email, name: user.name, role: 'candidate' },
  });
});

router.get('/me', auth, (req, res) => {
  res.json({
    user: {
      _id: req.user.userId || 'placeholder',
      id: req.user.userId,
      email: req.user.email,
      name: req.user.email?.split('@')[0] || 'User',
      role: req.user.role,
    },
  });
});

module.exports = router;
