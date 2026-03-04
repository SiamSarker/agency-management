const Leave = require('../models/Leave');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all leave requests
// @route   GET /api/leaves
// @access  Private
exports.getLeaves = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};

    // Filter by user
    if (req.query.user) {
      filter.user = req.query.user;
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by leave type
    if (req.query.leaveType) {
      filter.leaveType = req.query.leaveType;
    }

    // Filter by branch
    if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.startDate = {};
      if (req.query.startDate) {
        filter.startDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.startDate.$lte = new Date(req.query.endDate);
      }
    }

    // Filter for current user's leaves
    if (req.query.myLeaves === 'true') {
      filter.user = req.user._id;
    }

    const leaves = await Leave.find(filter)
      .populate('user', 'firstName lastName email avatar')
      .populate('branch', 'name code')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Leave.countDocuments(filter);

    res.json({
      success: true,
      data: leaves,
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

// @desc    Get single leave request
// @route   GET /api/leaves/:id
// @access  Private
exports.getLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('branch', 'name code address')
      .populate('approvedBy', 'firstName lastName email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create leave request
// @route   POST /api/leaves
// @access  Private
exports.createLeave = async (req, res) => {
  try {
    // Calculate total days
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

    const leaveData = {
      ...req.body,
      user: req.user._id,
      totalDays: diffDays,
      branch: req.user.branch
    };

    const leave = await Leave.create(leaveData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'leave',
      description: `Created leave request for ${diffDays} days`,
      resourceType: 'leave',
      resourceId: leave._id
    });

    res.status(201).json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update leave request
// @route   PUT /api/leaves/:id
// @access  Private
exports.updateLeave = async (req, res) => {
  try {
    let leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Only allow updating if leave is still pending
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${leave.status} leave request`
      });
    }

    // Only allow user to update their own leave or admin to update any
    if (leave.user.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this leave request'
      });
    }

    // Recalculate total days if dates are updated
    if (req.body.startDate || req.body.endDate) {
      const startDate = new Date(req.body.startDate || leave.startDate);
      const endDate = new Date(req.body.endDate || leave.endDate);
      const diffTime = Math.abs(endDate - startDate);
      req.body.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    leave = await Leave.findByIdAndUpdate(
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
      module: 'leave',
      description: `Updated leave request`,
      resourceType: 'leave',
      resourceId: leave._id
    });

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete leave request
// @route   DELETE /api/leaves/:id
// @access  Private
exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Only allow deleting if leave is still pending
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${leave.status} leave request`
      });
    }

    // Only allow user to delete their own leave or admin to delete any
    if (leave.user.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this leave request'
      });
    }

    await leave.deleteOne();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'leave',
      description: `Deleted leave request`,
      resourceType: 'leave',
      resourceId: leave._id
    });

    res.json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve leave request
// @route   PATCH /api/leaves/:id/approve
// @access  Private (Super Admin/HR)
exports.approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leave.status}`
      });
    }

    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedAt = Date.now();
    await leave.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'leave',
      description: `Approved leave request`,
      resourceType: 'leave',
      resourceId: leave._id
    });

    res.json({
      success: true,
      data: leave,
      message: 'Leave request approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject leave request
// @route   PATCH /api/leaves/:id/reject
// @access  Private (Super Admin/HR)
exports.rejectLeave = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leave.status}`
      });
    }

    leave.status = 'rejected';
    leave.rejectionReason = rejectionReason;
    leave.approvedBy = req.user._id;
    leave.approvedAt = Date.now();
    await leave.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'leave',
      description: `Rejected leave request`,
      resourceType: 'leave',
      resourceId: leave._id
    });

    res.json({
      success: true,
      data: leave,
      message: 'Leave request rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel leave request
// @route   PATCH /api/leaves/:id/cancel
// @access  Private
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Only allow user to cancel their own leave
    if (leave.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave request'
      });
    }

    if (leave.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is already cancelled'
      });
    }

    leave.status = 'cancelled';
    await leave.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'leave',
      description: `Cancelled leave request`,
      resourceType: 'leave',
      resourceId: leave._id
    });

    res.json({
      success: true,
      data: leave,
      message: 'Leave request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get leave statistics
// @route   GET /api/leaves/stats
// @access  Private
exports.getLeaveStats = async (req, res) => {
  try {
    const { user, year } = req.query;

    const filter = {};
    if (user) {
      filter.user = user;
    } else if (req.user.role !== 'super_admin') {
      // Staff can only see their own stats
      filter.user = req.user._id;
    }

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      filter.startDate = { $gte: startOfYear, $lte: endOfYear };
    }

    const totalRequests = await Leave.countDocuments(filter);
    const pendingRequests = await Leave.countDocuments({ ...filter, status: 'pending' });
    const approvedRequests = await Leave.countDocuments({ ...filter, status: 'approved' });
    const rejectedRequests = await Leave.countDocuments({ ...filter, status: 'rejected' });
    const cancelledRequests = await Leave.countDocuments({ ...filter, status: 'cancelled' });

    // Calculate total leave days by type
    const leavesByType = await Leave.aggregate([
      { $match: { ...filter, status: 'approved' } },
      { $group: { _id: '$leaveType', count: { $sum: 1 }, totalDays: { $sum: '$totalDays' } } },
      { $sort: { totalDays: -1 } }
    ]);

    // Calculate total approved leave days
    const totalLeaveDaysData = await Leave.aggregate([
      { $match: { ...filter, status: 'approved' } },
      { $group: { _id: null, totalDays: { $sum: '$totalDays' } } }
    ]);
    const totalLeaveDays = totalLeaveDaysData.length > 0 ? totalLeaveDaysData[0].totalDays : 0;

    res.json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        cancelledRequests,
        totalLeaveDays,
        leavesByType,
        approvalRate: totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
