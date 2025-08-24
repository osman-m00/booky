const {groupService} = require('../services/groupsService');


const createGroupController = async (req, res) =>{
  try {
    const userId = req.user?.id; // assuming middleware puts user info on req.user
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing user ID' });
    }

    // 2. Extract request body
    const { name, description, is_public, topic_tags, member_limit, avatar_url } = req.body;

    // 3. Validate request body
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
      if (!Array.isArray(topic_tags)) {
        return res.status(400).json({ error: 'topic_tags must be an array of strings' });
      }
      if (topic_tags.length > 5) {
        return res.status(400).json({ error: 'Maximum of 5 topic tags allowed' });
      }
      if (!topic_tags.every(tag => typeof tag === 'string')) {
        return res.status(400).json({ error: 'All topic tags must be strings' });
      }
    }

    if (member_limit !== undefined) {
      if (typeof member_limit !== 'number' || member_limit < 1 || member_limit > 1000) {
        return res.status(400).json({ error: 'member_limit must be a number between 1 and 1000' });
      }
    }

    // 4. Call the service layer to create group
    const group = await groupService.createGroup(
      name,
      description,
      is_public,
      topic_tags,
      userId,
      null, // invite_code handled inside service if private
      member_limit,
      avatar_url
    );

    // 5. Return success
    return res.status(201).json(group);

  } catch (err) {
    console.error('Create Group Controller Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const getGroupController = async (req, res) => {
    const groupId = req.params.groupId; // fixed typo

    try {
        const group = await groupService.getGroup(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        return res.status(200).json(group);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

const updateGroupController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: missing user ID' });
    }

    const groupId = req.params.groupId;
    const { name, description, is_public, topic_tags, member_limit, avatar_url } = req.body;

    // Validations
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
        if (!Array.isArray(topic_tags)) {
            return res.status(400).json({ error: 'topic_tags must be an array of strings' });
        }
        if (topic_tags.length > 5) {
            return res.status(400).json({ error: 'Maximum of 5 topic tags allowed' });
        }
        if (!topic_tags.every(tag => typeof tag === 'string')) {
            return res.status(400).json({ error: 'All topic tags must be strings' });
        }
    }

    if (member_limit !== undefined) {
        if (typeof member_limit !== 'number' || member_limit < 1 || member_limit > 1000) {
            return res.status(400).json({ error: 'member_limit must be a number between 1 and 1000' });
        }
    }

    if (avatar_url !== undefined) {
        if (typeof avatar_url !== 'string' || avatar_url.length === 0 || avatar_url.length > 500) {
            return res.status(400).json({ error: 'avatar_url must be a non-empty string up to 500 characters' });
        }
    }

    // Call service
    try {
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

        if (!updatedGroup) {
            return res.status(404).json({ ok: false, message: 'Group not found' });
        }

        return res.status(200).json(updatedGroup);
    } catch (error) {
        return res.status(500).json({ ok: false, message: 'Failed to update group', error: error.message });
    }
};

const deleteGroupController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: missing user ID' });
    }

    const groupId = req.params.groupId;

    try {
        const deleted = await groupService.deleteGroup(userId, groupId);

        if (!deleted) {
            return res.status(400).json({ ok: false, message: 'Failed to delete group' });
        }

        // 204 No Content must not send any body
        return res.status(204).send();
        
    } catch (error) {
        return res.status(500).json({ ok: false, message: 'Failed to delete group', error: error.message });
    }
};


const listGroupsController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: missing user ID' });
    }

    // Get query parameters
    const { page = 1, limit = 10, is_public, topic_tags } = req.query;

    // Validate page and limit
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({ error: 'page must be a positive integer' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ error: 'limit must be a positive integer (max 100)' });
    }

    // Validate is_public if provided
    let publicBool;
    if (is_public !== undefined) {
        if (is_public === 'true') publicBool = true;
        else if (is_public === 'false') publicBool = false;
        else return res.status(400).json({ error: 'is_public must be true or false' });
    }

    // Validate topic_tags if provided
    let tagsArray;
    if (topic_tags) {
        if (typeof topic_tags === 'string') {
            tagsArray = topic_tags.split(',').map(tag => tag.trim());
        } else if (Array.isArray(topic_tags)) {
            tagsArray = topic_tags;
        } else {
            return res.status(400).json({ error: 'topic_tags must be an array of strings' });
        }

        if (tagsArray.length > 5) {
            return res.status(400).json({ error: 'Maximum of 5 topic tags allowed' });
        }
        if (!tagsArray.every(tag => typeof tag === 'string')) {
            return res.status(400).json({ error: 'All topic tags must be strings' });
        }
    }

    try {
        const offset = (pageNum - 1) * limitNum;

        const listedGroups = await groupService.listGroups({
            is_public: publicBool,
            topic_tags: tagsArray,
            limit: limitNum,
            offset: offset
        });

        return res.status(200).json(listedGroups);
    } catch (error) {
        return res.status(500).json({ ok: false, message: 'Failed to list groups', error: error.message });
    }
};


const joinGroupController = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: missing user ID' });
    }

    const groupId = req.params.groupId;
    const { invite_code } = req.body;

    try {
        const result = await groupService.joinGroup(invite_code, groupId, userId);

        if (!result.ok) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ ok: false, message: 'Failed to join group', error: error.message });
    }
};

module.export = {createGroupController, getGroupController, updateGroupController, deleteGroupController, listGroupsController, joinGroupController}
