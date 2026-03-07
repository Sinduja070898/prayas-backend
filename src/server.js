require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
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
