const jwt = require('jsonwebtoken');

// Verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // includes userId, role, circuitCourt
    next();
  } catch (error) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'Court Admin') {
    return res.status(403).json({ msg: 'Admins only' });
  }
  next();
};

const verifyChief = (req, res, next) => {
  if (req.user.role !== 'Chief Justice') {
    return res.status(403).json({ msg: 'Chief Justice only' });
  }
  next();
};
module.exports = {
  verifyToken,
  verifyAdmin,
  verifyChief
};

