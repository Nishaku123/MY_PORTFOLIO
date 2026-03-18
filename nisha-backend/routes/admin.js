import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Rate limit login: 10 attempts per 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again later.' },
});

// ── POST /api/admin/login ──
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({ token, expiresIn: '8h' });
});

// ── GET /api/admin/messages ── (protected)
router.get('/messages', requireAuth, async (req, res) => {
  await db.read();
  const { page = 1, limit = 20, unread } = req.query;

  let messages = [...db.data.messages].reverse(); // newest first

  if (unread === 'true') {
    messages = messages.filter(m => !m.read);
  }

  const total  = messages.length;
  const start  = (page - 1) * limit;
  const paged  = messages.slice(start, start + Number(limit));

  return res.json({
    total,
    page:  Number(page),
    pages: Math.ceil(total / limit),
    unreadCount: db.data.messages.filter(m => !m.read).length,
    messages: paged,
  });
});

// ── PATCH /api/admin/messages/:id/read ── (protected)
router.patch('/messages/:id/read', requireAuth, async (req, res) => {
  await db.read();
  const msg = db.data.messages.find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  msg.read = true;
  await db.write();

  return res.json({ success: true, message: msg });
});

// ── DELETE /api/admin/messages/:id ── (protected)
router.delete('/messages/:id', requireAuth, async (req, res) => {
  await db.read();
  const before = db.data.messages.length;
  db.data.messages = db.data.messages.filter(m => m.id !== req.params.id);

  if (db.data.messages.length === before) {
    return res.status(404).json({ error: 'Message not found.' });
  }

  await db.write();
  return res.json({ success: true });
});

// ── DELETE /api/admin/messages ── delete all (protected)
router.delete('/messages', requireAuth, async (req, res) => {
  await db.read();
  db.data.messages = [];
  await db.write();
  return res.json({ success: true, message: 'All messages deleted.' });
});

export default router;
