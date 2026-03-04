const Trash = require('../models/Trash');
const Lead = require('../models/Lead');
const Student = require('../models/Student');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const Branch = require('../models/Branch');
const ActivityLog = require('../models/ActivityLog');

exports.getTrashItems = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};

    if (type) query.resourceType = type;

    const items = await Trash.find(query)
      .populate('deletedBy', 'firstName lastName')
      .sort({ deletedAt: -1 });

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreItem = async (req, res) => {
  try {
    // Only super admin can restore
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can restore items' });
    }

    const trashItem = await Trash.findById(req.params.id);

    if (!trashItem) {
      return res.status(404).json({ success: false, message: 'Trash item not found' });
    }

    // Get the model based on resource type
    const models = { Lead, Student, Task, Invoice, Branch };
    const Model = models[trashItem.resourceType];

    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid resource type' });
    }

    // Restore the item
    await Model.findByIdAndUpdate(trashItem.resourceId, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    });

    // Update trash record
    trashItem.restoredAt = Date.now();
    trashItem.restoredBy = req.user._id;
    await trashItem.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'restore',
      module: 'trash',
      description: `Restored ${trashItem.resourceType} from trash`,
      resourceType: trashItem.resourceType,
      resourceId: trashItem.resourceId
    });

    res.json({ success: true, message: 'Item restored successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.permanentlyDelete = async (req, res) => {
  try {
    // Only super admin can permanently delete
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can permanently delete items' });
    }

    const trashItem = await Trash.findById(req.params.id);

    if (!trashItem) {
      return res.status(404).json({ success: false, message: 'Trash item not found' });
    }

    const models = { Lead, Student, Task, Invoice, Branch };
    const Model = models[trashItem.resourceType];

    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid resource type' });
    }

    // Permanently delete from database
    await Model.findByIdAndDelete(trashItem.resourceId);

    // Update trash record
    trashItem.permanentlyDeletedAt = Date.now();
    trashItem.permanentlyDeletedBy = req.user._id;
    await trashItem.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      module: 'trash',
      description: `Permanently deleted ${trashItem.resourceType}`,
      resourceType: trashItem.resourceType,
      resourceId: trashItem.resourceId
    });

    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
