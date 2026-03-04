const Lead = require('../models/Lead');
const Student = require('../models/Student');
const ActivityLog = require('../models/ActivityLog');
const Trash = require('../models/Trash');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res) => {
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
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by source
    if (req.query.source) {
      filter.source = req.query.source;
    }

    // Filter by assigned user
    if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }

    // Filter by converted status
    if (req.query.convertedToStudent !== undefined) {
      filter.convertedToStudent = req.query.convertedToStudent === 'true';
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('studentId', 'studentId firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lead.countDocuments(filter);

    res.json({
      success: true,
      data: leads,
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

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('studentId', 'studentId firstName lastName email')
      .populate('followUps.completedBy', 'firstName lastName');

    if (!lead || lead.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      createdBy: req.user._id
    };

    const lead = await Lead.create(leadData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'lead',
      description: `Created lead: ${lead.firstName} ${lead.lastName}`,
      resourceType: 'lead',
      resourceId: lead._id
    });

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead || lead.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    lead = await Lead.findByIdAndUpdate(
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
      module: 'lead',
      description: `Updated lead: ${lead.firstName} ${lead.lastName}`,
      resourceType: 'lead',
      resourceId: lead._id
    });

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete lead (soft delete)
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead || lead.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Soft delete - move to trash
    lead.isDeleted = true;
    lead.deletedAt = Date.now();
    lead.deletedBy = req.user._id;
    await lead.save();

    // Create trash record
    await Trash.create({
      resourceType: 'Lead',
      resourceId: lead._id,
      resourceData: lead.toObject(),
      deletedBy: req.user._id,
      reason: req.body.reason
    });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'lead',
      description: `Deleted lead: ${lead.firstName} ${lead.lastName}`,
      resourceType: 'lead',
      resourceId: lead._id
    });

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add follow-up to lead
// @route   POST /api/leads/:id/follow-up
// @access  Private
exports.addFollowUp = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead || lead.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const followUp = {
      date: req.body.date,
      note: req.body.note,
      status: req.body.status || 'pending'
    };

    lead.followUps.push(followUp);
    await lead.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'lead',
      description: `Added follow-up to lead: ${lead.firstName} ${lead.lastName}`,
      resourceType: 'lead',
      resourceId: lead._id
    });

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update follow-up status
// @route   PATCH /api/leads/:id/follow-up/:followUpId
// @access  Private
exports.updateFollowUp = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead || lead.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const followUp = lead.followUps.id(req.params.followUpId);

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
      followUp.completedAt = Date.now();
    }

    await lead.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'lead',
      description: `Updated follow-up for lead: ${lead.firstName} ${lead.lastName}`,
      resourceType: 'lead',
      resourceId: lead._id
    });

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Convert lead to student
// @route   POST /api/leads/:id/convert
// @access  Private
exports.convertToStudent = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead || lead.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (lead.convertedToStudent) {
      return res.status(400).json({
        success: false,
        message: 'Lead already converted to student'
      });
    }

    // Create student from lead
    const studentData = {
      ...req.body,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      leadSource: lead._id,
      createdBy: req.user._id
    };

    const student = await Student.create(studentData);

    // Update lead
    lead.convertedToStudent = true;
    lead.studentId = student._id;
    lead.status = 'converted';
    await lead.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'lead',
      description: `Converted lead ${lead.firstName} ${lead.lastName} to student`,
      resourceType: 'lead',
      resourceId: lead._id,
      metadata: {
        studentId: student._id
      }
    });

    res.status(201).json({
      success: true,
      data: student,
      message: 'Lead converted to student successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get lead statistics
// @route   GET /api/leads/stats
// @access  Private
exports.getLeadStats = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments({ isDeleted: false });
    const newLeads = await Lead.countDocuments({ isDeleted: false, status: 'new' });
    const convertedLeads = await Lead.countDocuments({ isDeleted: false, convertedToStudent: true });
    const lostLeads = await Lead.countDocuments({ isDeleted: false, status: 'lost' });

    // Leads by source
    const leadsBySource = await Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Leads by status
    const leadsByStatus = await Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalLeads,
        newLeads,
        convertedLeads,
        lostLeads,
        leadsBySource,
        leadsByStatus,
        conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign lead to user
// @route   PATCH /api/leads/:id/assign
// @access  Private
exports.assignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (!lead || lead.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    lead.assignedTo = assignedTo;
    await lead.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'lead',
      description: `Assigned lead ${lead.firstName} ${lead.lastName} to user`,
      resourceType: 'lead',
      resourceId: lead._id,
      metadata: {
        assignedTo
      }
    });

    res.json({
      success: true,
      data: lead,
      message: 'Lead assigned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
