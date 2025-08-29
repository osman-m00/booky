// controllers/groupsController.js
import { groupService } from '../services/groupsService.js';
import { getOrCreateUser } from '../services/usersService.js';
import { isUuid } from 'uuid-validator';
import { realTimeService } from '../services/realtimeService.js';

// Helper: Get internal user from Clerk
async function getInternalUser(req) {
  const clerkUser = {
    id: req.user.id,
    email: req.user.claims.email,
    firstName: req.user.claims.first_name,
    lastName: req.user.claims.last_name,
    avatarUrl: req.user.claims.avatar_url,
  };
  return await getOrCreateUser(clerkUser);
}

// Create Group
export const createGroupController = async (req, res) => {
  try {
    const internalUser = await getInternalUser(req);
    const userId = internalUser.id;

    const { name, description, is_public, topic_tags, member_limit, avatar_url } = req.body;

    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return res.status(400).json({ error: 'Invalid group name (1–100 characters required)' });
    }
    if (description && description.length > 1000) {
      return res.status(400).json({ error: 'Description must be at most 1000 characters' });
    }
    if (typeof is_public !== 'boolean') {
      return res.status(400).json({ error: 'is_public must be true or false' });
    }
    if (topic_tags) {
      if (!Array.isArray(topic_tags) || topic_tags.length > 5 || !topic_tags.every(tag => typeof tag === 'string')) {
        return res.status(400).json({ error: 'Invalid topic_tags (array of max 5 strings)' });
      }
    }
    if (member_limit !== undefined && (typeof member_limit !== 'number' || member_limit < 1 || member_limit > 1000)) {
      return res.status(400).json({ error: 'member_limit must be a number between 1 and 1000' });
    }

    const group = await groupService.createGroup(
      name,
      description,
      is_public,
      topic_tags,
      userId,
      null, // invite_code handled internally
      member_limit,
      avatar_url
    );

    // Broadcast creation
    realTimeService.broadcastGroup(group.id, { event: 'INSERT', group });

    return res.status(201).json(group);
  } catch (err) {
    console.error('Create Group Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Group
export const getGroupController = async (req, res) => {
  const groupId = req.params.groupId;
  try {
    const group = await groupService.getGroup(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    return res.status(200).json(group);
  } catch (err) {
    console.error('Get Group Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update Group
export const updateGroupController = async (req, res) => {
  try {
    const internalUser = await getInternalUser(req);
    const userId = internalUser.id;
    const groupId = req.params.groupId;
    const { name, description, is_public, topic_tags, member_limit, avatar_url } = req.body;

    const updatedGroup = await groupService.updateGroup(
      groupId,
      userId,
      name,
      description,
      is_public,
      topic_tags,
      member_limit,
      avatar_url
    );

    if (!updatedGroup) return res.status(404).json({ ok: false, message: 'Group not found' });

    // Broadcast update
    realTimeService.broadcastGroup(groupId, { event: 'UPDATE', group: updatedGroup });

    return res.status(200).json(updatedGroup);
  } catch (err) {
    console.error('Update Group Error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to update group', error: err.message });
  }
};

// Delete Group
export const deleteGroupController = async (req, res) => {
  try {
    const internalUser = await getInternalUser(req);
    const userId = internalUser.id;
    const groupId = req.params.groupId;

    const deleted = await groupService.deleteGroup(userId, groupId);
    if (!deleted) return res.status(400).json({ ok: false, message: 'Failed to delete group' });

    // Broadcast deletion
    realTimeService.broadcastGroup(groupId, { event: 'DELETE', groupId });

    return res.status(204).send();
  } catch (err) {
    console.error('Delete Group Error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to delete group', error: err.message });
  }
};

// List Groups
export const listGroupsController = async (req, res) => {
  try {
    await getInternalUser(req); // Ensure authentication

    const { page = '1', limit = '10', cursor, direction = 'next', is_public, topic_tags, created_by } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (isNaN(pageNum) || pageNum < 1) return res.status(400).json({ error: 'page must be >=1' });
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) return res.status(400).json({ error: 'limit 1–100' });

    let parsedIsPublic;
    if (is_public !== undefined) {
      if (is_public === 'true') parsedIsPublic = true;
      else if (is_public === 'false') parsedIsPublic = false;
      else return res.status(400).json({ error: 'is_public must be true or false' });
    }

    let tagsArray;
    if (topic_tags) {
      tagsArray = typeof topic_tags === 'string' ? topic_tags.split(',').map(t => t.trim()) : topic_tags;
      if (!Array.isArray(tagsArray) || tagsArray.length > 5 || !tagsArray.every(t => typeof t === 'string')) {
        return res.status(400).json({ error: 'Invalid topic_tags' });
      }
    }

    let result;
    if (cursor) {
      // Cursor-based pagination
      result = await groupService.listGroupsCursor({ limit: limitNum, cursor, direction, is_public: parsedIsPublic, topic_tags: tagsArray, created_by });
    } else {
      // Offset-based pagination
      result = await groupService.listGroupsOffset({ limit: limitNum, page: pageNum, is_public: parsedIsPublic, topic_tags: tagsArray, created_by });
    }

    const pagination = {
      page: cursor ? null : pageNum,
      limit: limitNum,
      total: result.total || null,
      totalPages: result.totalPages || null,
      hasNext: !!result.nextCursor || (pageNum && pageNum < result.totalPages),
      hasPrev: !!result.prevCursor || (pageNum && pageNum > 1),
      nextCursor: result.nextCursor || null,
      prevCursor: result.prevCursor || null
    };

    return res.status(200).json({ groups: result.groups, pagination });

  } catch (err) {
    console.error('List Groups Error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to list groups', error: err.message });
  }
};

// Join Group
export const joinGroupController = async (req, res) => {
  try {
    const internalUser = await getInternalUser(req);
    const userId = internalUser.id;
    const groupId = req.params.groupId;
    const { invite_code } = req.body;

    const result = await groupService.joinGroup(invite_code, groupId, userId);
    if (!result.ok) return res.status(400).json(result);

    // Broadcast join
    realTimeService.broadcastGroup(groupId, {
      event: 'JOIN',
      user: { id: userId, name: internalUser.name, avatarUrl: internalUser.avatarUrl }
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Join Group Error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to join group', error: err.message });
  }
};

// Search Groups (with filters)
export const searchGroupsController = async (req, res) => {
  try {
    await getInternalUser(req);

    const { query, page = '1', limit = '10', cursor, direction = 'next', isPublic, topicTags, createdBy } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (isNaN(pageNum) || pageNum < 1) return res.status(400).json({ error: 'invalid_page' });
    if (isNaN(limitNum) || limitNum < 1) return res.status(400).json({ error: 'invalid_limit' });

    let parsedIsPublic;
    if (isPublic !== undefined) {
      if (isPublic !== 'true' && isPublic !== 'false') return res.status(400).json({ error: 'invalid_isPublic' });
      parsedIsPublic = isPublic === 'true';
    }

    let parsedTopicTags;
    if (topicTags) parsedTopicTags = typeof topicTags === 'string' ? topicTags.split(',').map(t => t.trim()) : topicTags;

    const result = await groupService.searchGroups({
      query,
      is_public: parsedIsPublic,
      topic_tags: parsedTopicTags,
      created_by: createdBy,
      page: pageNum,
      limit: limitNum,
      cursor,
      direction
    });

    const pagination = {
      page: cursor ? null : pageNum,
      limit: limitNum,
      total: result.total || null,
      totalPages: result.totalPages || null,
      hasNext: !!result.nextCursor || (pageNum && pageNum < result.totalPages),
      hasPrev: !!result.prevCursor || (pageNum && pageNum > 1),
      nextCursor: result.nextCursor || null,
      prevCursor: result.prevCursor || null
    };

    return res.status(200).json({ ok: true, groups: result.groups, pagination });

  } catch (err) {
    console.error('Search Groups Error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to search groups', error: err.message });
  }
};
