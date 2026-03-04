const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res) => {
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

    // Filter by branch
    if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }
    }

    // Filter for current user's attendance
    if (req.query.myAttendance === 'true') {
      filter.user = req.user._id;
    }

    const attendance = await Attendance.find(filter)
      .populate('user', 'firstName lastName email avatar')
      .populate('branch', 'name code')
      .populate('approvedBy', 'firstName lastName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);

    res.json({
      success: true,
      data: attendance,
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

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
// @access  Private
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('branch', 'name code address')
      .populate('approvedBy', 'firstName lastName email');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check-in
// @route   POST /api/attendance/check-in
// @access  Private
exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: today }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      date: new Date(),
      checkIn: new Date(),
      location: {
        checkIn: {
          latitude,
          longitude
        }
      },
      branch: req.user.branch,
      status: 'present'
    });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'attendance',
      description: 'Checked in',
      resourceType: 'attendance',
      resourceId: attendance._id
    });

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Checked in successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check-out
// @route   PATCH /api/attendance/check-out
// @access  Private
exports.checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    attendance.checkOut = new Date();
    attendance.location.checkOut = {
      latitude,
      longitude
    };

    // Calculate work hours
    const diffMs = attendance.checkOut - attendance.checkIn;
    attendance.workHours = diffMs / (1000 * 60 * 60); // Convert to hours

    await attendance.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'attendance',
      description: 'Checked out',
      resourceType: 'attendance',
      resourceId: attendance._id
    });

    res.json({
      success: true,
      data: attendance,
      message: 'Checked out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create attendance record (manual entry by admin)
// @route   POST /api/attendance
// @access  Private (Super Admin/HR)
exports.createAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.create(req.body);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'attendance',
      description: `Created attendance record for user`,
      resourceType: 'attendance',
      resourceId: attendance._id
    });

    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Super Admin/HR)
exports.updateAttendance = async (req, res) => {
  try {
    let attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    attendance = await Attendance.findByIdAndUpdate(
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
      module: 'attendance',
      description: `Updated attendance record`,
      resourceType: 'attendance',
      resourceId: attendance._id
    });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Super Admin only)
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await attendance.deleteOne();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'attendance',
      description: `Deleted attendance record`,
      resourceType: 'attendance',
      resourceId: attendance._id
    });

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
exports.getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, user } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (user) {
      filter.user = user;
    } else if (req.user.role !== 'super_admin') {
      // Staff can only see their own stats
      filter.user = req.user._id;
    }

    const totalDays = await Attendance.countDocuments(filter);
    const presentDays = await Attendance.countDocuments({ ...filter, status: 'present' });
    const absentDays = await Attendance.countDocuments({ ...filter, status: 'absent' });
    const halfDays = await Attendance.countDocuments({ ...filter, status: 'half_day' });
    const lateDays = await Attendance.countDocuments({ ...filter, status: 'late' });
    const onLeave = await Attendance.countDocuments({ ...filter, status: 'on_leave' });

    // Calculate total work hours
    const workHoursData = await Attendance.aggregate([
      { $match: { ...filter, workHours: { $exists: true } } },
      { $group: { _id: null, totalHours: { $sum: '$workHours' } } }
    ]);
    const totalWorkHours = workHoursData.length > 0 ? workHoursData[0].totalHours : 0;

    // Average work hours per day
    const avgWorkHours = totalDays > 0 ? (totalWorkHours / totalDays).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        totalDays,
        presentDays,
        absentDays,
        halfDays,
        lateDays,
        onLeave,
        totalWorkHours: totalWorkHours.toFixed(2),
        avgWorkHours,
        attendanceRate: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: today }
    });

    res.json({
      success: true,
      data: attendance,
      checkedIn: !!attendance,
      checkedOut: attendance ? !!attendance.checkOut : false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
