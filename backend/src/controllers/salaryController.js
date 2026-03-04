const Salary = require('../models/Salary');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all salary records
// @route   GET /api/salaries
// @access  Private (Super Admin/HR)
exports.getSalaries = async (req, res) => {
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

    // Filter by month and year
    if (req.query.month) {
      filter.month = parseInt(req.query.month);
    }
    if (req.query.year) {
      filter.year = parseInt(req.query.year);
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by branch
    if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    // Staff can only see their own salary
    if (req.user.role !== 'super_admin' && !req.query.user) {
      filter.user = req.user._id;
    }

    const salaries = await Salary.find(filter)
      .populate('user', 'firstName lastName email avatar')
      .populate('branch', 'name code')
      .populate('processedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Salary.countDocuments(filter);

    res.json({
      success: true,
      data: salaries,
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

// @desc    Get single salary record
// @route   GET /api/salaries/:id
// @access  Private
exports.getSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('branch', 'name code')
      .populate('processedBy', 'firstName lastName email');

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    // Staff can only view their own salary
    if (req.user.role !== 'super_admin' && salary.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this salary record'
      });
    }

    res.json({
      success: true,
      data: salary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create salary record
// @route   POST /api/salaries
// @access  Private (Super Admin/HR)
exports.createSalary = async (req, res) => {
  try {
    // Calculate gross and net salary
    let grossSalary = req.body.basicSalary;

    // Add allowances
    if (req.body.allowances && req.body.allowances.length > 0) {
      req.body.allowances.forEach(allowance => {
        grossSalary += allowance.amount;
      });
    }

    // Add bonus and overtime
    if (req.body.bonus) {
      grossSalary += req.body.bonus;
    }
    if (req.body.overtime?.amount) {
      grossSalary += req.body.overtime.amount;
    }

    req.body.grossSalary = grossSalary;

    // Calculate net salary (gross - deductions)
    let netSalary = grossSalary;
    if (req.body.deductions && req.body.deductions.length > 0) {
      req.body.deductions.forEach(deduction => {
        netSalary -= deduction.amount;
      });
    }

    req.body.netSalary = netSalary;
    req.body.processedBy = req.user._id;

    const salary = await Salary.create(req.body);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'salary',
      description: `Created salary record for ${req.body.month}/${req.body.year}`,
      resourceType: 'salary',
      resourceId: salary._id
    });

    res.status(201).json({
      success: true,
      data: salary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update salary record
// @route   PUT /api/salaries/:id
// @access  Private (Super Admin/HR)
exports.updateSalary = async (req, res) => {
  try {
    let salary = await Salary.findById(req.params.id);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    // Recalculate gross and net salary if needed
    if (req.body.basicSalary || req.body.allowances || req.body.deductions || req.body.bonus || req.body.overtime) {
      let grossSalary = req.body.basicSalary || salary.basicSalary;

      const allowances = req.body.allowances || salary.allowances;
      if (allowances && allowances.length > 0) {
        allowances.forEach(allowance => {
          grossSalary += allowance.amount;
        });
      }

      const bonus = req.body.bonus !== undefined ? req.body.bonus : salary.bonus;
      if (bonus) {
        grossSalary += bonus;
      }

      const overtime = req.body.overtime || salary.overtime;
      if (overtime?.amount) {
        grossSalary += overtime.amount;
      }

      req.body.grossSalary = grossSalary;

      let netSalary = grossSalary;
      const deductions = req.body.deductions || salary.deductions;
      if (deductions && deductions.length > 0) {
        deductions.forEach(deduction => {
          netSalary -= deduction.amount;
        });
      }

      req.body.netSalary = netSalary;
    }

    salary = await Salary.findByIdAndUpdate(
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
      module: 'salary',
      description: `Updated salary record`,
      resourceType: 'salary',
      resourceId: salary._id
    });

    res.json({
      success: true,
      data: salary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete salary record
// @route   DELETE /api/salaries/:id
// @access  Private (Super Admin only)
exports.deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    await salary.deleteOne();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'salary',
      description: `Deleted salary record`,
      resourceType: 'salary',
      resourceId: salary._id
    });

    res.json({
      success: true,
      message: 'Salary record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update salary status
// @route   PATCH /api/salaries/:id/status
// @access  Private (Super Admin/HR)
exports.updateSalaryStatus = async (req, res) => {
  try {
    const { status, paymentDate, paymentMethod } = req.body;

    const salary = await Salary.findById(req.params.id);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }

    salary.status = status;
    if (status === 'paid') {
      salary.paymentDate = paymentDate || Date.now();
      if (paymentMethod) {
        salary.paymentMethod = paymentMethod;
      }
    }

    await salary.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'salary',
      description: `Updated salary status to ${status}`,
      resourceType: 'salary',
      resourceId: salary._id
    });

    res.json({
      success: true,
      data: salary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get salary statistics
// @route   GET /api/salaries/stats
// @access  Private (Super Admin/HR)
exports.getSalaryStats = async (req, res) => {
  try {
    const { month, year, user } = req.query;

    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (user) filter.user = user;

    const totalRecords = await Salary.countDocuments(filter);
    const pendingRecords = await Salary.countDocuments({ ...filter, status: 'pending' });
    const processedRecords = await Salary.countDocuments({ ...filter, status: 'processed' });
    const paidRecords = await Salary.countDocuments({ ...filter, status: 'paid' });

    // Calculate total salary amounts
    const totalSalaryData = await Salary.aggregate([
      { $match: filter },
      { $group: { _id: null, totalGross: { $sum: '$grossSalary' }, totalNet: { $sum: '$netSalary' } } }
    ]);
    const totalGrossSalary = totalSalaryData.length > 0 ? totalSalaryData[0].totalGross : 0;
    const totalNetSalary = totalSalaryData.length > 0 ? totalSalaryData[0].totalNet : 0;

    // Calculate paid amount
    const paidAmountData = await Salary.aggregate([
      { $match: { ...filter, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);
    const totalPaidAmount = paidAmountData.length > 0 ? paidAmountData[0].total : 0;

    // Calculate pending amount
    const pendingAmountData = await Salary.aggregate([
      { $match: { ...filter, status: { $in: ['pending', 'processed'] } } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);
    const totalPendingAmount = pendingAmountData.length > 0 ? pendingAmountData[0].total : 0;

    res.json({
      success: true,
      data: {
        totalRecords,
        pendingRecords,
        processedRecords,
        paidRecords,
        totalGrossSalary,
        totalNetSalary,
        totalPaidAmount,
        totalPendingAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my salary (for current user)
// @route   GET /api/salaries/my-salary
// @access  Private
exports.getMySalary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const filter = { user: req.user._id };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const salaries = await Salary.find(filter)
      .populate('branch', 'name code')
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data: salaries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
