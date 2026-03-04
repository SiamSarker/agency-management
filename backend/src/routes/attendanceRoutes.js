const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getAttendanceById,
  checkIn,
  checkOut,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  getTodayAttendance
} = require('../controllers/attendanceController');
const { protect, authorize, checkPermission } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

// Special routes (before :id routes)
router.get('/stats', protect, getAttendanceStats);
router.get('/today', protect, getTodayAttendance);

// Check-in and check-out
router.post('/check-in', protect, logActivity('create', 'attendance', 'Checked in'), checkIn);
router.patch('/check-out', protect, logActivity('update', 'attendance', 'Checked out'), checkOut);

// Main CRUD routes
router
  .route('/')
  .get(protect, getAttendance)
  .post(
    protect,
    checkPermission('hr', 'create'),
    logActivity('create', 'attendance', 'Created attendance record'),
    createAttendance
  );

router
  .route('/:id')
  .get(protect, getAttendanceById)
  .put(
    protect,
    checkPermission('hr', 'update'),
    logActivity('update', 'attendance', 'Updated attendance record'),
    updateAttendance
  )
  .delete(
    protect,
    authorize('super_admin'),
    logActivity('delete', 'attendance', 'Deleted attendance record'),
    deleteAttendance
  );

module.exports = router;
