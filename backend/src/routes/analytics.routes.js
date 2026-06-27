const router = require('express').Router();
const { getSummary, getActivity, getRoles } = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary',  authorize('analytics', 'read'), getSummary);
router.get('/activity', authorize('analytics', 'read'), getActivity);
router.get('/roles',    authorize('analytics', 'read'), getRoles);

module.exports = router;
