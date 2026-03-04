const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  recordPayment,
  getInvoiceStats
} = require('../controllers/invoiceController');
const { protect, checkPermission } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

// Stats route (before :id routes)
router.get('/stats', protect, getInvoiceStats);

// Main CRUD routes
router
  .route('/')
  .get(protect, getInvoices)
  .post(
    protect,
    checkPermission('accounting', 'create'),
    logActivity('create', 'invoice', 'Created new invoice'),
    createInvoice
  );

router
  .route('/:id')
  .get(protect, checkPermission('accounting', 'read'), getInvoice)
  .put(
    protect,
    checkPermission('accounting', 'update'),
    logActivity('update', 'invoice', 'Updated invoice'),
    updateInvoice
  )
  .delete(
    protect,
    checkPermission('accounting', 'delete'),
    logActivity('delete', 'invoice', 'Deleted invoice'),
    deleteInvoice
  );

// Status update
router.patch(
  '/:id/status',
  protect,
  checkPermission('accounting', 'update'),
  logActivity('update', 'invoice', 'Updated invoice status'),
  updateInvoiceStatus
);

// Payment recording
router.post(
  '/:id/payment',
  protect,
  checkPermission('accounting', 'update'),
  logActivity('update', 'invoice', 'Recorded payment'),
  recordPayment
);

module.exports = router;
