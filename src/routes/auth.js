const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const { getUserByEmail, createUser } = require('../store');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

const DEFAULT_ADMIN = {
  id: 'default-admin',
  email: 'admin@prayas.com',
  name: 'Admin',
  password: 'admin@123',
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

  const emailStr = (email || '').trim().toLowerCase();
  const passwordStr = (password || '').trim();

  if (!emailStr || !passwordStr) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // const defaultEmail = (DEFAULT_ADMIN.email || '').trim().toLowerCase();
  // console.log('EMAIL BYTES:', Buffer.from(DEFAULT_ADMIN.email).toString('hex'));
  // console.log('INPUT BYTES:', Buffer.from(emailStr).toString('hex'));

  if (emailStr === defaultEmail) {
    if (passwordStr !== DEFAULT_ADMIN.password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
    // ✅ Admin matched — generate token and return immediately
    const token = jwt.sign(
      { userId: DEFAULT_ADMIN.id, email: DEFAULT_ADMIN.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      user: {
        _id: DEFAULT_ADMIN.id,
        id: DEFAULT_ADMIN.id,
        email: DEFAULT_ADMIN.email,
        name: DEFAULT_ADMIN.name,
        role: 'admin',
      },
    });
  }

  // ✅ Not admin — check database for candidate
  const user = await getUserByEmail(emailStr);
  if (!user) {
    return res.status(401).json({ error: 'No account found with this email. Please register first.' });
  }
  if (user.password !== passwordStr) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  if (role === 'admin' && user.role !== 'admin') {
    return res.status(401).json({ error: 'No admin account found with this email.' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: {
      _id: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
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
