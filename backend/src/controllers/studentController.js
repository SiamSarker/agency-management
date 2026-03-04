const Student = require('../models/Student');
const ActivityLog = require('../models/ActivityLog');
const Trash = require('../models/Trash');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = { isDeleted: false };

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { studentId: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by program
    if (req.query.program) {
      filter.program = { $regex: req.query.program, $options: 'i' };
    }

    // Filter by counsellor
    if (req.query.counsellor) {
      filter.counsellor = req.query.counsellor;
    }

    // Filter by branch
    if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    // Date range filter for enrollment
    if (req.query.startDate || req.query.endDate) {
      filter.enrollmentDate = {};
      if (req.query.startDate) {
        filter.enrollmentDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.enrollmentDate.$lte = new Date(req.query.endDate);
      }
    }

    const students = await Student.find(filter)
      .select('-password')
      .populate('counsellor', 'firstName lastName email')
      .populate('branch', 'name code')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(filter);

    res.json({
      success: true,
      data: students,
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

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('-password')
      .populate('counsellor', 'firstName lastName email phone')
      .populate('branch', 'name code address contact')
      .populate('createdBy', 'firstName lastName email')
      .populate('leadSource')
      .populate('documents.uploadedBy', 'firstName lastName')
      .populate('followUps.completedBy', 'firstName lastName');

    if (!student || student.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private
exports.createStudent = async (req, res) => {
  try {
    // Generate student ID if not provided
    if (!req.body.studentId) {
      const lastStudent = await Student.findOne().sort({ createdAt: -1 });
      const lastId = lastStudent ? parseInt(lastStudent.studentId.replace(/\D/g, '')) : 0;
      req.body.studentId = `STD${String(lastId + 1).padStart(6, '0')}`;
    }

    const studentData = {
      ...req.body,
      createdBy: req.user._id
    };

    const student = await Student.create(studentData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'student',
      description: `Created student: ${student.firstName} ${student.lastName}`,
      resourceType: 'student',
      resourceId: student._id
    });

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student || student.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Don't allow password update through this endpoint
    if (req.body.password) {
      delete req.body.password;
    }

    student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'student',
      description: `Updated student: ${student.firstName} ${student.lastName}`,
      resourceType: 'student',
      resourceId: student._id
    });

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete student (soft delete)
// @route   DELETE /api/students/:id
// @access  Private
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student || student.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete - move to trash
    student.isDeleted = true;
    student.deletedAt = Date.now();
    student.deletedBy = req.user._id;
    await student.save();

    // Create trash record
    await Trash.create({
      resourceType: 'Student',
      resourceId: student._id,
      resourceData: student.toObject(),
      deletedBy: req.user._id,
      reason: req.body.reason
    });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'student',
      description: `Deleted student: ${student.firstName} ${student.lastName}`,
      resourceType: 'student',
      resourceId: student._id
    });

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add document to student
// @route   POST /api/students/:id/documents
// @access  Private
exports.addDocument = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student || student.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const document = {
      ...req.body,
      uploadedBy: req.user._id,
      uploadedAt: Date.now()
    };

    student.documents.push(document);
    await student.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'student',
      description: `Added document to student: ${student.firstName} ${student.lastName}`,
      resourceType: 'student',
      resourceId: student._id
    });

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete document from student
// @route   DELETE /api/students/:id/documents/:documentId
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student || student.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.documents = student.documents.filter(
      doc => doc._id.toString() !== req.params.documentId
    );

    await student.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'student',
      description: `Deleted document from student: ${student.firstName} ${student.lastName}`,
      resourceType: 'student',
      resourceId: student._id
    });

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add follow-up to student
// @route   POST /api/students/:id/follow-up
// @access  Private
exports.addFollowUp = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student || student.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const followUp = {
      date: req.body.date,
      type: req.body.type,
      note: req.body.note,
      status: req.body.status || 'pending'
    };

    student.followUps.push(followUp);
    await student.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'student',
      description: `Added follow-up to student: ${student.firstName} ${student.lastName}`,
      resourceType: 'student',
      resourceId: student._id
    });

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update follow-up
// @route   PATCH /api/students/:id/follow-up/:followUpId
// @access  Private
exports.updateFollowUp = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student || student.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const followUp = student.followUps.id(req.params.followUpId);

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    followUp.status = req.body.status || followUp.status;
    followUp.note = req.body.note || followUp.note;

    if (req.body.status === 'completed') {
      followUp.completedBy = req.user._id;
    }

    await student.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'student',
      description: `Updated follow-up for student: ${student.firstName} ${student.lastName}`,
      resourceType: 'student',
      resourceId: student._id
    });

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student statistics
// @route   GET /api/students/stats
// @access  Private
exports.getStudentStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ isDeleted: false });
    const activeStudents = await Student.countDocuments({ isDeleted: false, status: 'active' });
    const inactiveStudents = await Student.countDocuments({ isDeleted: false, status: 'inactive' });
    const graduatedStudents = await Student.countDocuments({ isDeleted: false, status: 'graduated' });

    // Students by program
    const studentsByProgram = await Student.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$program', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Students by status
    const studentsByStatus = await Student.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        graduatedStudents,
        studentsByProgram,
        studentsByStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
