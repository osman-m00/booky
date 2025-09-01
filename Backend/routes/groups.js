const express = require('express');
const router = express.Router();
const clerkAuth = require('../middleware/clerkAuth');

const {
  createGroupController,
  getGroupController,
  updateGroupController,
  deleteGroupController,
  listGroupsController,
  joinGroupController,
  searchGroupsController
} = require('../controllers/groupsController');

router.use(clerkAuth);

router.post('/', createGroupController);
router.get('/:id', getGroupController);
router.put('/:id', updateGroupController);
router.delete('/:id', deleteGroupController);
router.get('/', listGroupsController);
router.post('/:id', joinGroupController);
router.get('/search', searchGroupsController);

// Infinite scroll routes
router.get('/search/next', (req, res) => {
  req.query.direction = 'next';
  searchGroupsController(req, res);
});

router.get('/search/prev', (req, res) => {
  req.query.direction = 'prev';
  searchGroupsController(req, res);
});

module.exports = router;
