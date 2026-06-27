const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getTenantClient } = require('../db/pool');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  buildTokenPayload,
  query,
} = require('../config/jwt');
const { query: dbQuery } = require('../db/pool');

/**
 * POST /api/auth/:tenantSlug/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema_name);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in tenant's isolated schema
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last_login
    await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Build tokens
    const payload = buildTokenPayload(user, req.tenant);
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ sub: user.id, schema: req.tenant.schema_name });

    // Persist refresh token
    await client.query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [uuidv4(), user.id, refreshToken]
    );

    // Log activity
    await client.query(
      `INSERT INTO activity_log (user_id, action, resource, meta)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'login', 'auth', JSON.stringify({ ip: req.ip })]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department,
      },
      tenant: {
        id:   req.tenant.id,
        name: req.tenant.name,
        slug: req.tenant.slug,
        plan: req.tenant.plan,
      },
    });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
const refresh = async (req, res, next) => {
  let client;
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

    const decoded = verifyRefreshToken(refreshToken);
    client = await getTenantClient(decoded.schema);

    // Verify token exists in DB (not revoked)
    const tokenRow = await client.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (tokenRow.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const userRow = await client.query('SELECT * FROM users WHERE id = $1', [decoded.sub]);
    if (userRow.rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = userRow.rows[0];

    // Get tenant info
    const tenantRow = await dbQuery(
      'SELECT * FROM public.tenants WHERE schema_name = $1',
      [decoded.schema]
    );
    const tenant = tenantRow.rows[0];

    const newAccessToken = generateAccessToken(buildTokenPayload(user, tenant));

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    next(err);
  } finally {
    if (client) client.release();
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await client.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /api/auth/me
 */
const me = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const result = await client.query(
      'SELECT id, name, email, role, department, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0], tenant: req.tenant });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { login, refresh, logout, me };
