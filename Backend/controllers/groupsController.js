const { groupService } = require('../services/groupsService');
const { getOrCreateUser } = require('../services/usersService');

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

const createGroupController = async (req, res) => {
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

    return res.status(201).json(group);
  } catch (err) {
    console.error('Create Group Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getGroupController = async (req, res) => {
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

const updateGroupController = async (req, res) => {
  try {
    const internalUser = await getInternalUser(req);
    const userId = internalUser.id;
    const groupId = req.params.groupId;
    const { name, description, is_public, topic_tags, member_limit, avatar_url } = req.body;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return res.status(400).json({ error: 'Invalid group name' });
    }
    if (description && description.length > 1000) return res.status(400).json({ error: 'Description too long' });
    if (typeof is_public !== 'boolean') return res.status(400).json({ error: 'is_public must be boolean' });
    if (topic_tags && (!Array.isArray(topic_tags) || topic_tags.length > 5 || !topic_tags.every(tag => typeof tag === 'string'))) {
      return res.status(400).json({ error: 'Invalid topic_tags' });
    }
    if (member_limit !== undefined && (typeof member_limit !== 'number' || member_limit < 1 || member_limit > 1000)) {
      return res.status(400).json({ error: 'Invalid member_limit' });
    }
    if (avatar_url !== undefined && (typeof avatar_url !== 'string' || avatar_url.length > 500)) {
      return res.status(400).json({ error: 'Invalid avatar_url' });
    }

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
    return res.status(200).json(updatedGroup);
  } catch (err) {
    console.error('Update Group Error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to update group', error: err.message });
  }
};

const deleteGroupController = async (req, res) => {
  try {
    const internalUser = await getInternalUser(req);
    const userId = internalUser.id;
    const groupId = req.params.groupId;

    const deleted = await groupService.deleteGroup(userId, groupId);
    if (!deleted) return res.status(400).json({ ok: false, message: 'Failed to delete group' });
    return res.status(204).send();
  } catch (err) {
    console.error('Delete Group Error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to delete group', error: err.message });
  }
};

const listGroupsController = async (req, res) => {
  try {
    await getInternalUser(req); // Only to ensure authentication

    const { page = 1, limit = 10, is_public, topic_tags } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) return res.status(400).json({ error: 'page must be >=1' });
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) return res.status(400).json({ error: 'limit 1–100' });

    let publicBool;
    if (is_public !== undefined) {
      if (is_public === 'true') publicBool = true;
      else if (is_public === 'false') publicBool = false;
      else return res.status(400).json({ error: 'is_public must be true or false' });
    }

    let tagsArray;
    if (topic_tags) {
      tagsArray = typeof topic_tags === 'string' ? topic_tags.split(',').map(t => t.trim()) : topic_tags;
      if (!Array.isArray(tagsArray) || tagsArray.length > 5 || !tagsArray.every(t => typeof t === 'string')) {
        return res.status(400).json({ error: 'Invalid topic_tags' });
      }
    }

    const offset = (pageNum - 1) * limitNum;
    const listedGroups = await groupService.listGroups({ is_public: publicBool, topic_tags: tagsArray, limit: limitNum, offset });
    return res.status(200).json(listedGroups);
  } catch (err) {
    console.error('List Groups Error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to list groups', error: err.message });
  }
};

const joinGroupController = async (req, res) => {
  try {
    const internalUser = await getInternalUser(req);
    const userId = internalUser.id;
    const groupId = req.params.groupId;
    const { invite_code } = req.body;

    const result = await groupService.joinGroup(invite_code, groupId, userId);
    if (!result.ok) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Join Group Error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to join group', error: err.message });
  }
};

module.exports = {
  createGroupController,
  getGroupController,
  updateGroupController,
  deleteGroupController,
  listGroupsController,
  joinGroupController
};
