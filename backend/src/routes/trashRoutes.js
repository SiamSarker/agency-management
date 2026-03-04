const express = require('express');
const {
  getTrashItems,
  restoreItem,
  permanentlyDelete
} = require('../controllers/trashController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getTrashItems);
router.patch('/:id/restore', authorize('super_admin'), restoreItem);
router.delete('/:id/permanent', authorize('super_admin'), permanentlyDelete);

module.exports = router;
