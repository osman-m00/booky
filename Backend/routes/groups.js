const express = require('express')
const router = express.Router();
const requireUser = require('../middleware/requireUser');

const {createGroupController, getGroupController, updateGroupController, deleteGroupController, listGroupsController, joinGroupController} = require('../controllers/groupsController');

router.use(requireUser);

router.post('/', createGroupController);
router.get('/:id', getGroupController);
router.put('/:id', updateGroupController);
router.delete('/:id', deleteGroupController);
router.get('/',listGroupsController);
router.post('/:id', joinGroupController);

module.exports = router;