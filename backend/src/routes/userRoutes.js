const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  updatePassword,
  getUserStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

// Stats route (before :id routes)
router.get('/stats', protect, getUserStats);

// Main CRUD routes
router
  .route('/')
  .get(protect, getUsers)
  .post(
    protect,
    authorize('super_admin'),
    logActivity('create', 'user', 'Created new user'),
    createUser
  );

router
  .route('/:id')
  .get(protect, getUser)
  .put(
    protect,
    authorize('super_admin'),
    logActivity('update', 'user', 'Updated user'),
    updateUser
  )
  .delete(
    protect,
    authorize('super_admin'),
    logActivity('delete', 'user', 'Deleted user'),
    deleteUser
  );

// Additional operations
router.patch(
  '/:id/toggle-status',
  protect,
  authorize('super_admin'),
  logActivity('update', 'user', 'Toggled user status'),
  toggleUserStatus
);

router.patch(
  '/:id/password',
  protect,
  authorize('super_admin'),
  logActivity('update', 'user', 'Updated user password'),
  updatePassword
);

module.exports = router;
