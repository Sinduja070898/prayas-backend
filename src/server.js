require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...localOrigins, ...frontendUrls])];

function isOriginAllowed(origin) {
  return !origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production';
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin) && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Assessment Platform API' });
});

const authRoutes = require('./routes/auth');
const applicationsRoutes = require('./routes/applications');
const questionsRoutes = require('./routes/questions');
const assessmentsRoutes = require('./routes/assessments');

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/assessments', assessmentsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
start().catch((err) => {
  console.error('Start failed:', err);
  process.exit(1);
});
