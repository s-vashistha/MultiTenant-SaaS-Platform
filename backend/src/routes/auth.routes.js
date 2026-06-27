const router = require('express').Router();
const { login, refresh, logout, me } = require('../controllers/auth.controller');
const { resolveTenant, authenticate } = require('../middleware/auth');

// Tenant-scoped login
router.post('/:tenantSlug/login', resolveTenant, login);

// Token refresh (schema embedded in refresh token)
router.post('/refresh', refresh);

// Protected routes
router.post('/logout',  authenticate, logout);
router.get('/me',       authenticate, me);

module.exports = router;
