const express = require('express');
const {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branchController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBranches)
  .post(authorize('super_admin'), createBranch);

router.route('/:id')
  .get(getBranch)
  .put(authorize('super_admin'), updateBranch)
  .delete(authorize('super_admin'), deleteBranch);

module.exports = router;
