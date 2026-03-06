require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, allowedOrigins[0]);
  },
  credentials: true,
}));
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
