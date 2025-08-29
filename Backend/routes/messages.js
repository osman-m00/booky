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

router.use(clerkAuth);

router.post('/', createMessageController);
router.get('/:id', getMessageController);
router.put('/:id', updateMessageController);
router.delete('/:id', deleteMessageController);
router.get('/group/:groupId', listMessagesController);
router.post('/:id/read', markMessageAsReadController);

// Infinite scroll routes for messages
router.get('/group/:groupId/next', (req, res) => {
  req.query.direction = 'next';
  listMessagesController(req, res);
});

router.get('/group/:groupId/prev', (req, res) => {
  req.query.direction = 'prev';
  listMessagesController(req, res);
});

module.exports = router;
