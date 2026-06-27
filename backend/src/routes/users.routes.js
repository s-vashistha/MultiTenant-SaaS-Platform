const router = require('express').Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

router.get('/',     authorize('users', 'read'),   getUsers);
router.get('/:id',  authorize('users', 'read'),   getUserById);
router.post('/',    authorize('users', 'write'),  createUser);
router.patch('/:id',authorize('users', 'write'),  updateUser);
router.delete('/:id',authorize('users','delete'), deleteUser);

module.exports = router;
