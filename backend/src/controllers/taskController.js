const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Trash = require('../models/Trash');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = { isDeleted: false };

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Filter by assigned user
    if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }

    // Filter by assigned by
    if (req.query.assignedBy) {
      filter.assignedBy = req.query.assignedBy;
    }

    // Filter tasks assigned to current user
    if (req.query.myTasks === 'true') {
      filter.assignedTo = req.user._id;
    }

    // Filter by due date range
    if (req.query.startDate || req.query.endDate) {
      filter.dueDate = {};
      if (req.query.startDate) {
        filter.dueDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.dueDate.$lte = new Date(req.query.endDate);
      }
    }

    // Filter overdue tasks
    if (req.query.overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $nin: ['completed', 'cancelled'] };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .populate('relatedLead', 'firstName lastName email')
      .populate('relatedStudent', 'firstName lastName email studentId')
      .populate('comments.commentedBy', 'firstName lastName')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('assignedBy', 'firstName lastName email')
      .populate('relatedLead', 'firstName lastName email phone')
      .populate('relatedStudent', 'firstName lastName email studentId')
      .populate('comments.commentedBy', 'firstName lastName avatar');

    if (!task || task.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      assignedBy: req.user._id
    };

    const task = await Task.create(taskData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'task',
      description: `Created task: ${task.title}`,
      resourceType: 'task',
      resourceId: task._id
    });

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task || task.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // If status is being changed to completed, set completedDate
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedDate = Date.now();
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'task',
      description: `Updated task: ${task.title}`,
      resourceType: 'task',
      resourceId: task._id
    });

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete task (soft delete)
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task || task.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Soft delete - move to trash
    task.isDeleted = true;
    task.deletedAt = Date.now();
    task.deletedBy = req.user._id;
    await task.save();

    // Create trash record
    await Trash.create({
      resourceType: 'Task',
      resourceId: task._id,
      resourceData: task.toObject(),
      deletedBy: req.user._id,
      reason: req.body.reason
    });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'task',
      description: `Deleted task: ${task.title}`,
      resourceType: 'task',
      resourceId: task._id
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task || task.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = {
      text: req.body.text,
      commentedBy: req.user._id,
      commentedAt: Date.now()
    };

    task.comments.push(comment);
    await task.save();

    // Populate the new comment
    await task.populate('comments.commentedBy', 'firstName lastName avatar');

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'task',
      description: `Added comment to task: ${task.title}`,
      resourceType: 'task',
      resourceId: task._id
    });

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task || task.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.status = status;

    if (status === 'completed') {
      task.completedDate = Date.now();
    } else if (status === 'in_progress' && !task.startDate) {
      task.startDate = Date.now();
    }

    await task.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'task',
      description: `Updated task status to ${status}: ${task.title}`,
      resourceType: 'task',
      resourceId: task._id
    });

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ isDeleted: false });
    const pendingTasks = await Task.countDocuments({ isDeleted: false, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ isDeleted: false, status: 'in_progress' });
    const completedTasks = await Task.countDocuments({ isDeleted: false, status: 'completed' });
    const overdueTasks = await Task.countDocuments({
      isDeleted: false,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    });

    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // My tasks (for current user)
    const myTasks = await Task.countDocuments({
      isDeleted: false,
      assignedTo: req.user._id,
      status: { $nin: ['completed', 'cancelled'] }
    });

    res.json({
      success: true,
      data: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        myTasks,
        tasksByPriority,
        tasksByStatus,
        completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
