const express = require('express');
const router = express.Router();
const requireUser = require('../middleware/requireUser');

const {
  createMessageController,
  getMessageController,
  updateMessageController,
  deleteMessageController,
  listMessagesController,
  markMessageAsReadController
} = require('../controllers/messageController');

router.use(requireUser);

router.post('/', createMessageController);

router.get('/:id', getMessageController);

router.put('/:id', updateMessageController);

router.delete('/:id', deleteMessageController);

router.get('/group/:groupId', listMessagesController);

router.post('/:id/read', markMessageAsReadController);

module.exports = router;
