const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');

const {
  createMessageController,
  getMessageController,
  updateMessageController,
  deleteMessageController,
  listMessagesController,
  markMessageAsReadController
} = require('../controllers/messageController');

// Protect all routes
router.use(clerkAuth);

router.post('/', createMessageController);
router.get('/:id', getMessageController);
router.put('/:id', updateMessageController);
router.delete('/:id', deleteMessageController);
router.get('/group/:groupId', listMessagesController);
router.post('/:id/read', markMessageAsReadController);

module.exports = router;
