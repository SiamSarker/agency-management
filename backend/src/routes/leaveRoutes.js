const express = require('express');
const router = express.Router();
const {
  getLeaves,
  getLeave,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveStats
} = require('../controllers/leaveController');
const { protect, checkPermission } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

// Stats route (before :id routes)
router.get('/stats', protect, getLeaveStats);

// Main CRUD routes
router
  .route('/')
  .get(protect, getLeaves)
  .post(
    protect,
    logActivity('create', 'leave', 'Created leave request'),
    createLeave
  );

router
  .route('/:id')
  .get(protect, getLeave)
  .put(
    protect,
    logActivity('update', 'leave', 'Updated leave request'),
    updateLeave
  )
  .delete(
    protect,
    logActivity('delete', 'leave', 'Deleted leave request'),
    deleteLeave
  );

// Approval operations
router.patch(
  '/:id/approve',
  protect,
  checkPermission('hr', 'update'),
  logActivity('update', 'leave', 'Approved leave request'),
  approveLeave
);

router.patch(
  '/:id/reject',
  protect,
  checkPermission('hr', 'update'),
  logActivity('update', 'leave', 'Rejected leave request'),
  rejectLeave
);

router.patch(
  '/:id/cancel',
  protect,
  logActivity('update', 'leave', 'Cancelled leave request'),
  cancelLeave
);

module.exports = router;
