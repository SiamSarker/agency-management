const express = require('express');
const {
  getActivityLogs,
  getUserActivityStats
} = require('../controllers/activityLogController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getActivityLogs);
router.get('/stats/:userId', authorize('super_admin'), getUserActivityStats);

module.exports = router;
