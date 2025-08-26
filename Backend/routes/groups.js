const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');

const {
  createGroupController,
  getGroupController,
  updateGroupController,
  deleteGroupController,
  listGroupsController,
  joinGroupController,
  searchGroupsController
} = require('../controllers/groupsController');

// Protect all routes below
router.use(clerkAuth);

router.post('/', createGroupController);
router.get('/:id', getGroupController);
router.put('/:id', updateGroupController);
router.delete('/:id', deleteGroupController);
router.get('/', listGroupsController);
router.post('/:id', joinGroupController);
router.get('/search', searchGroupsController);

module.exports = router;
