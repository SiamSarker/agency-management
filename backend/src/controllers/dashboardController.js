const Lead = require('../models/Lead');
const Student = require('../models/Student');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get counts
    const [
      totalLeads,
      totalStudents,
      totalTasks,
      pendingTasks,
      totalInvoices,
      paidInvoices,
      activeUsers
    ] = await Promise.all([
      Lead.countDocuments({ isDeleted: false, ...dateFilter }),
      Student.countDocuments({ isDeleted: false, ...dateFilter }),
      Task.countDocuments({ isDeleted: false, ...dateFilter }),
      Task.countDocuments({ isDeleted: false, status: { $in: ['pending', 'in_progress'] } }),
      Invoice.countDocuments({ isDeleted: false, ...dateFilter }),
      Invoice.countDocuments({ isDeleted: false, status: 'paid', ...dateFilter }),
      User.countDocuments({ isActive: true })
    ]);

    // Revenue stats
    const revenueStats = await Invoice.aggregate([
      { $match: { isDeleted: false, status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' }
        }
      }
    ]);

    // Lead conversion rate
    const convertedLeads = await Lead.countDocuments({
      isDeleted: false,
      convertedToStudent: true,
      ...dateFilter
    });
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    // Recent activities
    const recentActivities = await ActivityLog.find()
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Task completion rate
    const completedTasks = await Task.countDocuments({
      isDeleted: false,
      status: 'completed',
      ...dateFilter
    });
    const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          totalStudents,
          totalTasks,
          pendingTasks,
          totalInvoices,
          paidInvoices,
          activeUsers,
          conversionRate: parseFloat(conversionRate),
          taskCompletionRate: parseFloat(taskCompletionRate)
        },
        revenue: {
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          totalPaid: revenueStats[0]?.totalPaid || 0
        },
        recentActivities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeadAnalytics = async (req, res) => {
  try {
    const leadsByStatus = await Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const leadsBySource = await Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    const monthlyLeads = await Lead.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: { leadsByStatus, leadsBySource, monthlyLeads }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRevenueAnalytics = async (req, res) => {
  try {
    const monthlyRevenue = await Invoice.aggregate([
      { $match: { isDeleted: false, status: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const revenueByBranch = await Invoice.aggregate([
      { $match: { isDeleted: false, status: 'paid' } },
      {
        $group: {
          _id: '$branch',
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branch' } },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } }
    ]);

    res.json({
      success: true,
      data: { monthlyRevenue, revenueByBranch }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStaffPerformance = async (req, res) => {
  try {
    const staffStats = await User.aggregate([
      { $match: { role: 'staff', isActive: true } },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'tasks'
        }
      },
      {
        $lookup: {
          from: 'leads',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'leads'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          totalTasks: { $size: '$tasks' },
          completedTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'completed'] }
              }
            }
          },
          totalLeads: { $size: '$leads' },
          convertedLeads: {
            $size: {
              $filter: {
                input: '$leads',
                as: 'lead',
                cond: { $eq: ['$$lead.convertedToStudent', true] }
              }
            }
          }
        }
      }
    ]);

    res.json({ success: true, data: staffStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
