const {supabase} = require('../config/supabase');
const  nanoid  = require('nanoid'); 
const { realTimeService } = require('./realtimeService'); 

async function createGroup(name, description, is_public, topic_tags, created_by, member_limit, avatar_url) {
  const newGroup = {
    name,
    description,
    is_public,
    topic_tags,
    created_by
  };

  if (member_limit) newGroup.member_limit = member_limit;
  if (avatar_url) newGroup.avatar_url = avatar_url;

  if (is_public === false) {
    newGroup.invite_code = nanoid(9);
  }

  try {
    // Insert group
    const { data, error } = await supabase
      .from('groups')
      .insert([newGroup])
      .select('id, name, description, is_public, topic_tags, created_by, invite_code, member_limit, avatar_url, created_at')

    if (error) throw new Error('Failed to insert into groups table');

    const group = data[0];

    // Insert creator as admin participant
    const { error: grouperror } = await supabase
      .from('group_participants')
      .insert([{ group_id: group.id, user_id: group.created_by, role: 'admin' }]);

    if (grouperror) throw new Error('Failed to insert into group_participants');

    // Count participants
    const { count, error: countError } = await supabase
      .from('group_participants')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id);

    if (countError) throw new Error('Failed to get participant count');

    return { ...group, participant_count: count };

  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

async function getGroup(groupId){
    try{
        const {data, error} = await supabase
        .from('groups')
        .select('name, description, is_public, topic_tags, is_active, avatar_url, created_by, user:users(name, avatar_url)')
        .eq('id', groupId);
        if(error){
            throw new Error('Error fetching group');
        }

    const group = data[0]; // Get the first (and only) row
    if (!group) throw new Error('Group not found');
     const { count, error: countError } = await supabase
      .from('group_participants')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (countError) throw new Error('Failed to get participant count');
    return { ...data, participant_count: count };

    }catch(error){
        console.log('database Error for get group', error);
    }
}


async function updateGroup({
  groupId,
  userId,
  name,
  description,
  is_public,
  topic_tags,
  member_limit,
  avatar_url
}) {

  try {
    // 1. Fetch current group
    const { data: groupData, error: fetchError } = await supabase
      .from('groups')
      .select('id, is_public, invite_code, name, description, topic_tags, member_limit, avatar_url')
      .eq('id', groupId)
      .single(); // fetch a single row

    if (fetchError || !groupData) throw new Error('Group not found');

    // 2. Verify user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('group_participants')
      .select('role')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .single(); // only need one row

    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('User does not have admin permissions');
    }

    // 3. Prepare updated fields
    const updatedGroup = {};
    if (name !== undefined) updatedGroup.name = name;
    if (description !== undefined) updatedGroup.description = description;
    if (topic_tags !== undefined) updatedGroup.topic_tags = topic_tags;
    if (member_limit !== undefined) updatedGroup.member_limit = member_limit;
    if (avatar_url !== undefined) updatedGroup.avatar_url = avatar_url;

    // 4. Handle public/private & invite code
    if (is_public !== undefined) {
      updatedGroup.is_public = is_public;

      // Generate new invite code if changing from public -> private
      if (!is_public && groupData.is_public) {
        updatedGroup.invite_code = nanoid(9);
      }
    }

    // 5. Update the group
    const { data: updatedData, error: updateError } = await supabase
      .from('groups')
      .update(updatedGroup)
      .eq('id', groupId)
      .select();

    if (updateError) throw new Error('Failed to update group');

    // 6. Return the updated group
    return updatedData[0];

  } catch (error) {
    console.error('updateGroup failed:', error);
    throw error;
  }
}

async function deleteGroup(userId, groupId) {
  try {
    const { data, error } = await supabase
      .from('groups')
      .delete()
      .eq('created_by', userId)
      .eq('id', groupId)
      .select();

    if (error) throw new Error('Failed to delete group');

    if (!data || data.length === 0) {
      throw new Error('Group not found or user not authorized');
    }

    return {
      ok: true,
      message: 'Group deleted successfully'
    };
  } catch (error) {
    console.error('Group deletion error', error);
    throw error;
  }
}

async function listGroups({ is_public, topic_tags, created_by,limit = 10, offset = 0, sort = 'newest' }) {
  try {
    let query = supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        is_public,
        topic_tags,
        member_limit,
        avatar_url,
        created_by,
        created_at,
        user:users(id, name, avatar_url)
      `);

    if (is_public !== undefined) {
      query = query.eq('is_public', is_public);
    }

    if (topic_tags && topic_tags.length > 0) {
      // Matches if any tag overlaps
      query = query.overlaps('topic_tags', topic_tags);
    }

    if (created_by) {
      query = query.eq('created_by', created_by);
    }

    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'most_popular') {
    
    }

    query = query.range(offset, offset + limit - 1);

    const { data: groups, error } = await query;
    if (error) throw new Error('Failed to fetch groups');

    if (!groups || groups.length === 0) {
      return { groups: [], total: 0, limit, offset };
    }

    const groupIds = groups.map(g => g.id);
    const { data: countsData, error: countError } = await supabase
      .from('group_participants')
      .select('group_id', { count: 'exact', head: false })
      .in('group_id', groupIds);

    if (countError) throw new Error('Failed to fetch participant counts');

    const countsMap = {};
    countsData.forEach(p => {
      countsMap[p.group_id] = (countsMap[p.group_id] || 0) + 1;
    });

    // Attach participant counts
    let groupsWithCounts = groups.map(g => ({
      ...g,
      participant_count: countsMap[g.id] || 0
    }));

    if (sort === 'most_popular') {
      groupsWithCounts = groupsWithCounts.sort(
        (a, b) => b.participant_count - a.participant_count
      );
    }

    const { count: total, error: totalError } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw new Error('Failed to fetch total group count');

    return {
      groups: groupsWithCounts,
      total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error listing groups:', error);
    throw error;
  }
}

async function joinGroup(invite_code, groupId, userId) {
  try {
    // 1. Check if user is already a participant
    const { data: existing, error: existingError } = await supabase
      .from('group_participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (existingError) throw new Error('Failed to check existing participants');
    if (existing && existing.length > 0) {
      throw new Error('User is already a participant in this group');
    }

    // 2. Fetch group info (invite_code + is_public)
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('invite_code, is_public')
      .eq('id', groupId)
      .single();

    if (groupError) throw new Error('Failed to fetch group info');

    // 3. Check invite code if group is private
    if (!groupData.is_public && groupData.invite_code !== invite_code) {
      throw new Error('Invalid invite code');
    }

    // 4. Insert user into group_participants
    const { data: insertedMember, error: insertError } = await supabase
      .from('group_participants')
      .insert([{ group_id: groupId, user_id: userId, role: 'member' }])
      .select()
      .single();

    if (insertError) throw new Error('Failed to insert member into group');

  realTimeService.broadcastGroup(groupId, {
  event: "UPDATE",
  group: updatedData[0],
});
    return {
      ok: true,
      message: 'Member inserted successfully',
      role: insertedMember.role,
    };

  } catch (error) {
    console.log('Error in joinGroup function: ', error);
    return { ok: false, message: error.message };
  }
}


async function searchGroups({ query, isPublic, topicTags, createdBy, page = 1, limit = 10 }) {
  try {
    let supabaseQuery = supabase
      .from('groups')
      .select('*');

    // Text search on name or description
    if (query) {
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    // Filter by public status
    if (typeof isPublic === 'boolean') {
      supabaseQuery = supabaseQuery.eq('is_public', isPublic);
    }

    // Filter by topic tags (array overlap)
    if (Array.isArray(topicTags) && topicTags.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('topic_tags', topicTags);
    }

    // Filter by createdBy UUID
    if (createdBy) {
      supabaseQuery = supabaseQuery.eq('created_by', createdBy);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data, error } = await supabaseQuery;
    if (error) throw error;

    return { ok: true, groups: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}



module.exports = {createGroup, getGroup, updateGroup, deleteGroup, listGroups, joinGroup, searchGroups};