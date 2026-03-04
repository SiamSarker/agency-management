const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  addFollowUp,
  updateFollowUp,
  convertToStudent,
  getLeadStats,
  assignLead
} = require('../controllers/leadController');
const { protect, authorize, checkPermission } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

// Stats route (before :id routes)
router.get('/stats', protect, getLeadStats);

// Main CRUD routes
router
  .route('/')
  .get(protect, getLeads)
  .post(
    protect,
    checkPermission('leads', 'create'),
    logActivity('create', 'lead', 'Created new lead'),
    createLead
  );

router
  .route('/:id')
  .get(protect, checkPermission('leads', 'read'), getLead)
  .put(
    protect,
    checkPermission('leads', 'update'),
    logActivity('update', 'lead', 'Updated lead'),
    updateLead
  )
  .delete(
    protect,
    checkPermission('leads', 'delete'),
    logActivity('delete', 'lead', 'Deleted lead'),
    deleteLead
  );

// Follow-up operations
router.post(
  '/:id/follow-up',
  protect,
  checkPermission('leads', 'update'),
  logActivity('update', 'lead', 'Added follow-up to lead'),
  addFollowUp
);

router.patch(
  '/:id/follow-up/:followUpId',
  protect,
  checkPermission('leads', 'update'),
  logActivity('update', 'lead', 'Updated follow-up'),
  updateFollowUp
);

// Convert to student
router.post(
  '/:id/convert',
  protect,
  checkPermission('leads', 'create'),
  logActivity('create', 'lead', 'Converted lead to student'),
  convertToStudent
);

// Assign lead
router.patch(
  '/:id/assign',
  protect,
  checkPermission('leads', 'update'),
  logActivity('update', 'lead', 'Assigned lead'),
  assignLead
);

module.exports = router;
