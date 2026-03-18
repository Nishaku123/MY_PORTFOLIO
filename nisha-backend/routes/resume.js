import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Rate limit: 20 downloads per IP per hour
const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many download requests. Try again later.' },
});

// ── GET /api/resume/download ──
router.get('/download', downloadLimiter, (req, res) => {
  const filename = process.env.RESUME_FILENAME || 'Nisha_Kumari_Resume.pdf';
  const filePath  = path.join(__dirname, '..', 'public', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'Resume not found. Please contact nishamanjhi630@gmail.com for the latest version.',
    });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  return res.sendFile(filePath);
});

// ── GET /api/resume/info ── (tells frontend whether resume exists)
router.get('/info', (req, res) => {
  const filename = process.env.RESUME_FILENAME || 'Nisha_Kumari_Resume.pdf';
  const filePath  = path.join(__dirname, '..', 'public', filename);
  const exists    = fs.existsSync(filePath);

  return res.json({
    available: exists,
    filename:  exists ? filename : null,
  });
});

export default router;
