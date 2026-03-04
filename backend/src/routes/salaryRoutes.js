const express = require('express');
const router = express.Router();
const {
  getSalaries,
  getSalary,
  createSalary,
  updateSalary,
  deleteSalary,
  updateSalaryStatus,
  getSalaryStats,
  getMySalary
} = require('../controllers/salaryController');
const { protect, authorize, checkPermission } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

// Special routes (before :id routes)
router.get('/stats', protect, checkPermission('hr', 'read'), getSalaryStats);
router.get('/my-salary', protect, getMySalary);

// Main CRUD routes
router
  .route('/')
  .get(protect, getSalaries)
  .post(
    protect,
    checkPermission('hr', 'create'),
    logActivity('create', 'salary', 'Created salary record'),
    createSalary
  );

router
  .route('/:id')
  .get(protect, getSalary)
  .put(
    protect,
    checkPermission('hr', 'update'),
    logActivity('update', 'salary', 'Updated salary record'),
    updateSalary
  )
  .delete(
    protect,
    authorize('super_admin'),
    logActivity('delete', 'salary', 'Deleted salary record'),
    deleteSalary
  );

// Status update
router.patch(
  '/:id/status',
  protect,
  checkPermission('hr', 'update'),
  logActivity('update', 'salary', 'Updated salary status'),
  updateSalaryStatus
);

module.exports = router;
