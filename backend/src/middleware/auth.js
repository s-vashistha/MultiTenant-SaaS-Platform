const { verifyAccessToken } = require('../config/jwt');
const { query } = require('../db/pool');

/**
 * authenticate — verifies JWT, attaches user + tenant context to req.
 * All subsequent middleware can trust req.user and req.tenant.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.user = {
      id:    decoded.sub,
      name:  decoded.name,
      email: decoded.email,
      role:  decoded.role,
    };

    req.tenant = {
      id:     decoded.tenantId,
      slug:   decoded.tenantSlug,
      schema: decoded.schema,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * resolveTenant — looks up the tenant from the slug in the URL param.
 * Used on the login route before a JWT exists.
 */
const resolveTenant = async (req, res, next) => {
  try {
    const slug = req.params.tenantSlug || req.body.tenantSlug;
    if (!slug) return res.status(400).json({ error: 'tenantSlug is required' });

    const result = await query(
      'SELECT id, name, slug, plan, schema_name FROM public.tenants WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    req.tenant = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * RBAC permission matrix.
 * Format: { role: { resource: [allowed actions] } }
 */
const PERMISSIONS = {
  admin: {
    users:     ['read', 'write', 'delete'],
    analytics: ['read', 'write', 'delete'],
    billing:   ['read', 'write'],
    roles:     ['read', 'write', 'delete'],
    activity:  ['read'],
  },
  manager: {
    users:     ['read', 'write'],
    analytics: ['read'],
    billing:   ['read'],
    roles:     ['read'],
    activity:  ['read'],
  },
  viewer: {
    users:     ['read'],
    analytics: ['read'],
    billing:   [],
    roles:     [],
    activity:  ['read'],
  },
};

/**
 * authorize(resource, action) — RBAC middleware factory.
 * Usage: router.get('/users', authenticate, authorize('users', 'read'), handler)
 */
const authorize = (resource, action) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ error: 'Unauthorized' });

  const allowed = PERMISSIONS[role]?.[resource] || [];
  if (!allowed.includes(action)) {
    return res.status(403).json({
      error: 'Forbidden',
      detail: `Role '${role}' cannot perform '${action}' on '${resource}'`,
    });
  }
  next();
};

module.exports = { authenticate, resolveTenant, authorize, PERMISSIONS };
