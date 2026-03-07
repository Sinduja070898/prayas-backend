const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const { getUserByEmail, createUser } = require('../store');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

const DEFAULT_ADMIN = {
  id: 'default-admin',
  email: 'adminSindhu@gmail.com',
  name: 'Sindhu',
  password: 'Sindhu@123',
  role: 'admin',
};

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
  let user = await getUserByEmail(email);

  if (r === 'admin' && !user) {
    const e = (email || '').trim().toLowerCase();
    if (e === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
      user = DEFAULT_ADMIN;
    }
  }

  if (!user) {
    const msg = r === 'admin' ? 'No admin account found with this email.' : 'No account found with this email. Please register first.';
    return res.status(401).json({ error: msg });
  }
  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  if (r === 'admin' && user.role !== 'admin') {
    return res.status(401).json({ error: 'No admin account found with this email.' });
  }
  const userRole = user.role || 'candidate';
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: userRole },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: { _id: user.id, id: user.id, email: user.email, name: user.name, role: userRole },
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
