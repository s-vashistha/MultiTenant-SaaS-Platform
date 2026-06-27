const router = require('express').Router();
const { authenticate, PERMISSIONS } = require('../middleware/auth');

// Returns the full permission matrix for the logged-in user's role
router.get('/my-permissions', authenticate, (req, res) => {
  const perms = PERMISSIONS[req.user.role] || {};
  res.json({
    role: req.user.role,
    permissions: perms,
    tenant: req.tenant,
  });
});

// Returns all roles and their permissions (admin only)
router.get('/matrix', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  res.json({ matrix: PERMISSIONS });
});

module.exports = router;
