// controllers/messageController.js
import {
  createMessage,
  getMessage,
  updateMessage,
  deleteMessage,
  listMessages,
  markMessageAsRead
} from '../services/messageService.js';
import { realTimeService } from '../services/realtimeService.js';


import { getOrCreateUser } from '../services/usersService.js';

// a. Create Message Controller
export async function createMessageController(req, res) {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };

    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const { groupId, content, messageType, replyToId } = req.body;

    // Input validation
    if (!groupId) return res.status(400).json({ error: 'groupId is required' });
    if (!content || content.length < 1 || content.length > 2000) {
      return res.status(400).json({ error: 'content must be 1-2000 characters' });
    }
    const allowedTypes = ['text', 'image', 'link'];
    if (!allowedTypes.includes(messageType)) {
      return res.status(400).json({ error: 'Invalid message type' });
    }

    const message = await createMessage(userId, groupId, content, messageType, replyToId);
    realTimeService.broadcastMessage(groupId, {
      event: 'INSERT',
      message,
      });
    return res.status(201).json(message);

  } catch (err) {
    if (err.message.includes('User is not a participant')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('Reply-to message not found')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Server error' });
  }
}

// b. Get Message Controller
export async function getMessageController(req, res) {
  try {
    const { messageId } = req.params;
    if (!messageId || messageId.length < 10) {
      return res.status(400).json({ error: 'Invalid messageId' });
    }

    const message = await getMessage(messageId);
    return res.status(200).json(message);

  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

// c. Update Message Controller
export async function updateMessageController(req, res) {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.length < 1 || content.length > 2000) {
      return res.status(400).json({ error: 'content must be 1-2000 characters' });
    }

    const updated = await updateMessage(messageId, userId, content);
    realTimeService.broadcastMessage(updated.group_id, {
    event: 'UPDATE',
    message: updated,
});
    return res.status(200).json(updated);

  } catch (err) {
    if (err.message.includes('User is not the sender')) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Server error' });
  }
}

// d. Delete Message Controller
export async function deleteMessageController(req, res) {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await getMessage(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const groupId = message.group_id; // save groupId for broadcasting

    await deleteMessage(messageId, userId);

    realTimeService.broadcastMessage(groupId, {
      event: 'DELETE',
      messageId
    });

    return res.status(204).send();

  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}


// e. List Messages Controller
export async function listMessagesController(req, res) {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const { groupId } = req.params;
    let { page = 1, limit = 10, replyToId } = req.query;

    // validation
    if (!groupId) return res.status(400).json({ error: 'groupId is required' });
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 100) limit = 10;

    const result = await listMessages(groupId, userId, page, limit, replyToId);
    return res.status(200).json(result);

  } catch (err) {
    if (err.message.includes('User is not a participant')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('Reply-to message not found')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Server error' });
  }
}

// f. Mark Message as Read Controller
export async function markMessageAsReadController(req, res) {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const { messageId } = req.params;

    await markMessageAsRead(messageId, userId);
    return res.status(200).json({ ok: true, message: 'Message marked as read' });

  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
