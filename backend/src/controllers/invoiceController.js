const Invoice = require('../models/Invoice');
const ActivityLog = require('../models/ActivityLog');
const Trash = require('../models/Trash');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = { isDeleted: false };

    // Search functionality
    if (req.query.search) {
      filter.invoiceNumber = { $regex: req.query.search, $options: 'i' };
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by student
    if (req.query.student) {
      filter.student = req.query.student;
    }

    // Filter by branch
    if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    // Date range filter for invoice date
    if (req.query.startDate || req.query.endDate) {
      filter.invoiceDate = {};
      if (req.query.startDate) {
        filter.invoiceDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.invoiceDate.$lte = new Date(req.query.endDate);
      }
    }

    // Filter overdue invoices
    if (req.query.overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $nin: ['paid', 'cancelled'] };
    }

    const invoices = await Invoice.find(filter)
      .populate('student', 'firstName lastName email studentId')
      .populate('branch', 'name code')
      .populate('createdBy', 'firstName lastName')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      data: invoices,
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

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('student', 'firstName lastName email studentId phone address')
      .populate('branch', 'name code address contact')
      .populate('createdBy', 'firstName lastName email');

    if (!invoice || invoice.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res) => {
  try {
    // Generate invoice number if not provided
    if (!req.body.invoiceNumber) {
      const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
      const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.replace(/\D/g, '')) : 0;
      req.body.invoiceNumber = `INV${String(lastNumber + 1).padStart(6, '0')}`;
    }

    // Calculate totals
    let subtotal = 0;
    req.body.items.forEach(item => {
      item.amount = item.quantity * item.unitPrice;
      subtotal += item.amount;
    });

    req.body.subtotal = subtotal;

    const taxAmount = (subtotal * (req.body.tax?.rate || 0)) / 100;
    req.body.tax = {
      rate: req.body.tax?.rate || 0,
      amount: taxAmount
    };

    req.body.total = subtotal + taxAmount - (req.body.discount || 0);

    const invoiceData = {
      ...req.body,
      createdBy: req.user._id
    };

    const invoice = await Invoice.create(invoiceData);

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'invoice',
      description: `Created invoice: ${invoice.invoiceNumber}`,
      resourceType: 'invoice',
      resourceId: invoice._id
    });

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice || invoice.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Recalculate totals if items are updated
    if (req.body.items) {
      let subtotal = 0;
      req.body.items.forEach(item => {
        item.amount = item.quantity * item.unitPrice;
        subtotal += item.amount;
      });

      req.body.subtotal = subtotal;

      const taxRate = req.body.tax?.rate || invoice.tax.rate || 0;
      const taxAmount = (subtotal * taxRate) / 100;
      req.body.tax = {
        rate: taxRate,
        amount: taxAmount
      };

      const discount = req.body.discount !== undefined ? req.body.discount : invoice.discount;
      req.body.total = subtotal + taxAmount - discount;
    }

    invoice = await Invoice.findByIdAndUpdate(
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
      module: 'invoice',
      description: `Updated invoice: ${invoice.invoiceNumber}`,
      resourceType: 'invoice',
      resourceId: invoice._id
    });

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete invoice (soft delete)
// @route   DELETE /api/invoices/:id
// @access  Private
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice || invoice.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Soft delete - move to trash
    invoice.isDeleted = true;
    invoice.deletedAt = Date.now();
    invoice.deletedBy = req.user._id;
    await invoice.save();

    // Create trash record
    await Trash.create({
      resourceType: 'Invoice',
      resourceId: invoice._id,
      resourceData: invoice.toObject(),
      deletedBy: req.user._id,
      reason: req.body.reason
    });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'invoice',
      description: `Deleted invoice: ${invoice.invoiceNumber}`,
      resourceType: 'invoice',
      resourceId: invoice._id
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
// @access  Private
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice || invoice.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    invoice.status = status;

    // Check if invoice is overdue
    if (status !== 'paid' && status !== 'cancelled' && new Date() > invoice.dueDate) {
      invoice.status = 'overdue';
    }

    await invoice.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'invoice',
      description: `Updated invoice status to ${status}: ${invoice.invoiceNumber}`,
      resourceType: 'invoice',
      resourceId: invoice._id
    });

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Record payment
// @route   POST /api/invoices/:id/payment
// @access  Private
exports.recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDate } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice || invoice.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    invoice.paidAmount = (invoice.paidAmount || 0) + amount;
    invoice.paymentMethod = paymentMethod;
    invoice.paymentDate = paymentDate || Date.now();

    // Update status based on payment
    if (invoice.paidAmount >= invoice.total) {
      invoice.status = 'paid';
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'partially_paid';
    }

    await invoice.save();

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'invoice',
      description: `Recorded payment of ${amount} for invoice: ${invoice.invoiceNumber}`,
      resourceType: 'invoice',
      resourceId: invoice._id,
      metadata: {
        amount,
        paymentMethod
      }
    });

    res.json({
      success: true,
      data: invoice,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private
exports.getInvoiceStats = async (req, res) => {
  try {
    const totalInvoices = await Invoice.countDocuments({ isDeleted: false });
    const paidInvoices = await Invoice.countDocuments({ isDeleted: false, status: 'paid' });
    const pendingInvoices = await Invoice.countDocuments({ isDeleted: false, status: { $in: ['draft', 'sent'] } });
    const overdueInvoices = await Invoice.countDocuments({
      isDeleted: false,
      dueDate: { $lt: new Date() },
      status: { $nin: ['paid', 'cancelled'] }
    });

    // Calculate total revenue
    const revenueData = await Invoice.aggregate([
      { $match: { isDeleted: false, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Calculate pending amount
    const pendingData = await Invoice.aggregate([
      { $match: { isDeleted: false, status: { $in: ['sent', 'partially_paid', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$total', '$paidAmount'] } } } }
    ]);
    const pendingAmount = pendingData.length > 0 ? pendingData[0].total : 0;

    // Monthly revenue
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          isDeleted: false,
          status: 'paid',
          paymentDate: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          total: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalRevenue,
        pendingAmount,
        monthlyRevenue,
        collectionRate: totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
