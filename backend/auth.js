// auth.js — JWT utilities
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign(
    { username: user.username, is_admin: user.is_admin },
    SECRET,
    { expiresIn: '2h' }
  );
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

module.exports = { generateToken, verifyToken };
