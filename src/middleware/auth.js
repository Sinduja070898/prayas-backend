const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const isDev = process.env.NODE_ENV !== 'production';

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);

  if (isDev && token.startsWith('mock-jwt-')) {
    const role = token.includes('admin') ? 'admin' : 'candidate';
    req.user = { userId: token, email: 'dev@mock', role };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This endpoint requires role '${role}'. Your token has role '${req.user?.role || 'none'}'.`,
      });
    }
    next();
  };
}

module.exports = { auth, requireRole };
