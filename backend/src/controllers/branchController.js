const Branch = require('../models/Branch');
const Trash = require('../models/Trash');
const ActivityLog = require('../models/ActivityLog');

exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isDeleted: false })
      .populate('manager', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('manager', 'firstName lastName email phone');

    if (!branch || branch.isDeleted) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);

    await ActivityLog.create({
      user: req.user._id,
      action: 'create',
      module: 'branch',
      description: `Created branch: ${branch.name}`,
      resourceType: 'branch',
      resourceId: branch._id
    });

    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    let branch = await Branch.findById(req.params.id);

    if (!branch || branch.isDeleted) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'update',
      module: 'branch',
      description: `Updated branch: ${branch.name}`,
      resourceType: 'branch',
      resourceId: branch._id
    });

    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch || branch.isDeleted) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    await Trash.create({
      resourceType: 'Branch',
      resourceId: branch._id,
      resourceData: branch.toObject(),
      deletedBy: req.user._id
    });

    branch.isDeleted = true;
    branch.deletedAt = Date.now();
    branch.deletedBy = req.user._id;
    await branch.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'branch',
      description: `Deleted branch: ${branch.name}`,
      resourceType: 'branch',
      resourceId: branch._id
    });

    res.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
