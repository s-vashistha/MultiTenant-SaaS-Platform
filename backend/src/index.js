require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db/init');

const app = express();

// ── Security middleware ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rate limiting — reduces brute force on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many login attempts, please try again later' },
});
app.use('/api/auth', authLimiter);

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/users',     require('./routes/users.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/rbac',      require('./routes/rbac.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List available tenants (for login UI)
app.get('/api/tenants', async (req, res, next) => {
  try {
    const { query } = require('./db/pool');
    const result = await query('SELECT id, name, slug, plan FROM public.tenants ORDER BY name');
    res.json({ tenants: result.rows });
  } catch (err) { next(err); }
});

// ── Error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Boot ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 NexaCore API running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
})();
