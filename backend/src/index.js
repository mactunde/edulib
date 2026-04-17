require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const requestLogger   = require('./middleware/logger');
const authRoutes      = require('./routes/auth');
const bookRoutes      = require('./routes/books');
const adminRoutes     = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const activityRoutes  = require('./routes/activity');
const userRoutes      = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────
const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Too many attempts. Please wait 15 minutes.' },
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/books',    bookRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/admin',    adminAuthRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/users',    userRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start server (only when run directly, not when required by tests) ──
if (require.main === module) {
  app.listen(PORT, () => console.log(`✅  EduLib API running on port ${PORT}`));
}

module.exports = app;
