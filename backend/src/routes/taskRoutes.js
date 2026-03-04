const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  updateTaskStatus,
  getTaskStats
} = require('../controllers/taskController');
const { protect, checkPermission } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

// Stats route (before :id routes)
router.get('/stats', protect, getTaskStats);

// Main CRUD routes
router
  .route('/')
  .get(protect, getTasks)
  .post(
    protect,
    checkPermission('tasks', 'create'),
    logActivity('create', 'task', 'Created new task'),
    createTask
  );

router
  .route('/:id')
  .get(protect, checkPermission('tasks', 'read'), getTask)
  .put(
    protect,
    checkPermission('tasks', 'update'),
    logActivity('update', 'task', 'Updated task'),
    updateTask
  )
  .delete(
    protect,
    checkPermission('tasks', 'delete'),
    logActivity('delete', 'task', 'Deleted task'),
    deleteTask
  );

// Comment operations
router.post(
  '/:id/comments',
  protect,
  checkPermission('tasks', 'update'),
  logActivity('update', 'task', 'Added comment to task'),
  addComment
);

// Status update
router.patch(
  '/:id/status',
  protect,
  checkPermission('tasks', 'update'),
  logActivity('update', 'task', 'Updated task status'),
  updateTaskStatus
);

module.exports = router;
