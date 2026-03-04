const express = require('express');
const {
  getDashboardStats,
  getLeadAnalytics,
  getRevenueAnalytics,
  getStaffPerformance
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/leads/analytics', getLeadAnalytics);
router.get('/revenue/analytics', getRevenueAnalytics);
router.get('/staff/performance', getStaffPerformance);

module.exports = router;
