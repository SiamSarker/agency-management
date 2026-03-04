const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  addDocument,
  deleteDocument,
  addFollowUp,
  updateFollowUp,
  getStudentStats
} = require('../controllers/studentController');
const { protect, checkPermission } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

// Stats route (before :id routes)
router.get('/stats', protect, getStudentStats);

// Main CRUD routes
router
  .route('/')
  .get(protect, getStudents)
  .post(
    protect,
    checkPermission('students', 'create'),
    logActivity('create', 'student', 'Created new student'),
    createStudent
  );

router
  .route('/:id')
  .get(protect, checkPermission('students', 'read'), getStudent)
  .put(
    protect,
    checkPermission('students', 'update'),
    logActivity('update', 'student', 'Updated student'),
    updateStudent
  )
  .delete(
    protect,
    checkPermission('students', 'delete'),
    logActivity('delete', 'student', 'Deleted student'),
    deleteStudent
  );

// Document operations
router.post(
  '/:id/documents',
  protect,
  checkPermission('students', 'update'),
  logActivity('update', 'student', 'Added document to student'),
  addDocument
);

router.delete(
  '/:id/documents/:documentId',
  protect,
  checkPermission('students', 'delete'),
  logActivity('update', 'student', 'Deleted document from student'),
  deleteDocument
);

// Follow-up operations
router.post(
  '/:id/follow-up',
  protect,
  checkPermission('students', 'update'),
  logActivity('update', 'student', 'Added follow-up to student'),
  addFollowUp
);

router.patch(
  '/:id/follow-up/:followUpId',
  protect,
  checkPermission('students', 'update'),
  logActivity('update', 'student', 'Updated follow-up'),
  updateFollowUp
);

module.exports = router;
