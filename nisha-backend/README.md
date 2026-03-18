# Nisha Kumari — Portfolio Backend

Full Express.js backend for the portfolio site. Handles contact form submissions, email notifications, message storage, an admin dashboard, and resume downloads.

---

## Features

| Feature | Endpoint |
|---|---|
| Submit contact form | `POST /api/contact` |
| Download resume | `GET /api/resume/download` |
| Admin login | `POST /api/admin/login` |
| View all messages | `GET /api/admin/messages` |
| Mark message as read | `PATCH /api/admin/messages/:id/read` |
| Delete message | `DELETE /api/admin/messages/:id` |
| Delete all messages | `DELETE /api/admin/messages` |

---

## Setup (Local)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Then edit `.env`:

- **EMAIL_USER** — your Gmail address
- **EMAIL_PASS** — a Gmail **App Password** (not your real password)
  - Go to: myaccount.google.com → Security → 2-Step Verification → App Passwords
  - Select "Mail" + "Other (custom name)" → Generate
- **ADMIN_USERNAME / ADMIN_PASSWORD** — your admin panel credentials
- **JWT_SECRET** — any long random string (e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### 3. Add your resume PDF
Place your resume PDF inside the `public/` folder:
```
public/Nisha_Kumari_Resume.pdf
```
Make sure `RESUME_FILENAME` in `.env` matches the filename.

### 4. Run the server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server runs on **http://localhost:3001**

---

## Connect to the Frontend

In your `nisha-portfolio.html`, the contact form already submits to `http://localhost:3001/api/contact`.

For production, update `FRONTEND_URL` in `.env` and change the API URL in the frontend to your deployed server URL.

---

## Admin Panel

Open `http://localhost:3001/public/admin.html` in your browser.

Log in with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` from your `.env`.

From the dashboard you can:
- See total / unread / today's message counts
- Read all messages
- Reply via email (opens your email client)
- Mark messages as read
- Delete individual or all messages

---

## Deploying to Production

**Recommended free options:**
- **Railway** — `railway up` (auto-detects Node.js, free tier)
- **Render** — connect GitHub repo, set env variables in dashboard
- **Fly.io** — `fly launch` (generous free tier)

Set all your `.env` variables as environment variables on the platform.

---

## API Reference

### POST /api/contact
**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "message": "Hi Nisha, I'd love to chat..."
}
```
**Response (201):**
```json
{ "success": true, "message": "Message received! I'll get back to you soon." }
```

### POST /api/admin/login
**Body:**
```json
{ "username": "nisha", "password": "yourpassword" }
```
**Response:**
```json
{ "token": "eyJ...", "expiresIn": "8h" }
```
Pass the token as `Authorization: Bearer <token>` on all `/api/admin/*` routes.

---

## File Structure
```
nisha-backend/
├── server.js               # Main Express app
├── .env.example            # Environment template
├── package.json
├── db/
│   ├── database.js         # lowdb setup (JSON file database)
│   └── db.json             # Auto-created — stores messages
├── middleware/
│   └── auth.js             # JWT verification middleware
├── routes/
│   ├── contact.js          # Form submission + email
│   ├── admin.js            # Admin CRUD + login
│   └── resume.js           # Resume download
└── public/
    ├── admin.html          # Admin dashboard UI
    └── Nisha_Kumari_Resume.pdf   ← place your PDF here
```
