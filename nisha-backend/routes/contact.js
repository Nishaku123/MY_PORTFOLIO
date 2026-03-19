import express from 'express';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import db from '../db/database.js';

const router = express.Router();

// ── Rate limit: max 5 submissions per IP per 15 min ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Email transporter (Gmail) ──
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// ── Validation ──
function validate({ name, email, message }) {
  const errors = [];
  if (!name || name.trim().length < 2)         errors.push('Name must be at least 2 characters.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
  if (!message || message.trim().length < 10)  errors.push('Message must be at least 10 characters.');
  if (message && message.trim().length > 2000) errors.push('Message must be under 2000 characters.');
  return errors;
}

// ── POST /api/contact ──
router.post('/', limiter, async (req, res) => {
  const { name, email, message } = req.body;

  // Validate
  const errors = validate({ name, email, message });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  // Save to database
  const entry = {
    id:        Date.now().toString(),
    name:      name.trim(),
    email:     email.trim().toLowerCase(),
    message:   message.trim(),
    createdAt: new Date().toISOString(),
    read:      false,
  };

  await db.read();
  db.data.messages.push(entry);
  await db.write();

  // Send email notification
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to:   process.env.EMAIL_TO,
      replyTo: email,
      subject: `📬 New message from ${name} — Portfolio`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0d0f0e;color:#e8ebe6;border-radius:8px;padding:32px;">
          <h2 style="color:#7fff6a;margin-top:0">New Portfolio Message</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#6b7068;width:80px">From</td><td style="padding:8px 0"><strong>${name}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#6b7068">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#7fff6a">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b7068;vertical-align:top">Message</td><td style="padding:8px 0;line-height:1.7">${message.trim().replace(/\n/g,'<br/>')}</td></tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#6b7068">Sent via nishamanjhi630.dev portfolio</p>
        </div>
      `,
    });

    // Also send an auto-reply to the sender
    await transporter.sendMail({
      from: `"Nisha Kumari" <${process.env.EMAIL_USER}>`,
      to:   email,
      subject: `Thanks for reaching out, ${name}!`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1814;padding:32px;">
          <h2 style="color:#0d0f0e">Hey ${name}! 👋</h2>
          <p style="line-height:1.7">Thanks for your message — I got it and will get back to you as soon as possible.</p>
          <p style="line-height:1.7">In the meantime, feel free to check out my work on <a href="https://github.com/Nishaku123" style="color:#2a7a2a">GitHub</a>.</p>
          <p style="margin-top:24px">— Nisha Kumari</p>
          <p style="font-size:12px;color:#999;margin-top:8px">Visakhapatnam, India · nishamanjhi630@gmail.com</p>
        </div>
      `,
    });
  } catch (emailErr) {
    // Email failed but message was saved — don't block the user
    console.error('Email send error:', emailErr.message);
  }

  return res.status(201).json({
    success: true,
    message: 'Message received! I\'ll get back to you soon.',
  });
});

export default router;
