const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const examinerOnly = (req, res, next) => {
  if (req.user.userType !== 'examiner') {
    return res.status(403).json({ error: 'Access denied. Examiner only.' });
  }
  next();
};

const centerOnly = (req, res, next) => {
  if (req.user.userType !== 'center') {
    return res.status(403).json({ error: 'Access denied. Exam center only.' });
  }
  next();
};

module.exports = { authMiddleware, examinerOnly, centerOnly };