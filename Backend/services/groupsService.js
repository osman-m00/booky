const { supabase } = require('../config/supabase');
const nanoid = require('nanoid');
const { realTimeService } = require('./realtimeService');
const { encodeCursor, decodeCursor } = require('../utils/cursor');

// ------------------------------
// Group CRUD
// ------------------------------
async function createGroup(name, description, is_public, topic_tags, created_by, member_limit, avatar_url) {
  const newGroup = { name, description, is_public, topic_tags, created_by };
  if (member_limit) newGroup.member_limit = member_limit;
  if (avatar_url) newGroup.avatar_url = avatar_url;
  if (is_public === false) newGroup.invite_code = nanoid(9);

  try {
    const { data, error } = await supabase
      .from('groups')
      .insert([newGroup])
      .select('*');

    if (error) throw new Error('Failed to insert group');

    const group = data[0];

    const { error: participantError } = await supabase
      .from('group_participants')
      .insert([{ group_id: group.id, user_id: group.created_by, role: 'admin' }]);
    if (participantError) throw new Error('Failed to insert group creator');

    return group;
  } catch (err) {
    console.error('createGroup error:', err);
    throw err;
  }
}

async function getGroup(groupId) {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*, user:users(id, name, avatar_url)')
      .eq('id', groupId)
      .single();
    if (error) throw new Error('Group not found');

    const { count, error: countError } = await supabase
      .from('group_participants')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);
    if (countError) throw new Error('Failed to count participants');

    return { ...data, participant_count: count };
  } catch (err) {
    console.error('getGroup error:', err);
    throw err;
  }
}

async function updateGroup({ groupId, userId, name, description, is_public, topic_tags, member_limit, avatar_url }) {
  try {
    const { data: groupData, error: fetchError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();
    if (fetchError || !groupData) throw new Error('Group not found');

    const { data: roleData, error: roleError } = await supabase
      .from('group_participants')
      .select('role')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .single();
    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('User not authorized');
    }

    const updatedGroup = {};
    if (name !== undefined) updatedGroup.name = name;
    if (description !== undefined) updatedGroup.description = description;
    if (topic_tags !== undefined) updatedGroup.topic_tags = topic_tags;
    if (member_limit !== undefined) updatedGroup.member_limit = member_limit;
    if (avatar_url !== undefined) updatedGroup.avatar_url = avatar_url;
    if (is_public !== undefined) {
      updatedGroup.is_public = is_public;
      if (!is_public && groupData.is_public) updatedGroup.invite_code = nanoid(9);
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('groups')
      .update(updatedGroup)
      .eq('id', groupId)
      .select();
    if (updateError) throw new Error('Failed to update group');

    // Emit real-time update
    realTimeService.broadcastGroup(groupId, {
      event: 'UPDATE',
      group: updatedData[0],
    });

    return updatedData[0];
  } catch (err) {
    console.error('updateGroup error:', err);
    throw err;
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
    if (!data || data.length === 0) throw new Error('Group not found or unauthorized');

    return { ok: true, message: 'Group deleted successfully' };
  } catch (err) {
    console.error('deleteGroup error:', err);
    throw err;
  }
}

// ------------------------------
// Pagination Functions
// ------------------------------

// Offset-based list
async function listGroupsOffset({ is_public, topic_tags, created_by, page = 1, limit = 10, sort = 'newest' }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from('groups').select('*', { count: 'exact' });

  if (is_public !== undefined) query = query.eq('is_public', is_public);
  if (topic_tags?.length) query = query.overlaps('topic_tags', topic_tags);
  if (created_by) query = query.eq('created_by', created_by);

  if (sort === 'newest') query = query.order('created_at', { ascending: false });
  else if (sort === 'oldest') query = query.order('created_at', { ascending: true });

  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    groups: data,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

// Cursor-based list
async function listGroupsCursor({ limit = 10, cursor = null, direction = 'next', is_public, topic_tags, created_by }) {
  let query = supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: direction === 'prev' })
    .limit(limit);

  if (is_public !== undefined) query = query.eq('is_public', is_public);
  if (topic_tags?.length) query = query.overlaps('topic_tags', topic_tags);
  if (created_by) query = query.eq('created_by', created_by);

  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    query = direction === 'next' ? query.lt('created_at', decodedCursor) : query.gt('created_at', decodedCursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    groups: data,
    nextCursor: data.length ? encodeCursor(data[data.length - 1].created_at) : null,
    prevCursor: data.length ? encodeCursor(data[0].created_at) : null,
  };
}
// ------------------------------
// Join/Search Groups
// ------------------------------
async function joinGroup(invite_code, groupId, userId) {
  try {
    const { data: existing } = await supabase
      .from('group_participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (existing?.length) throw new Error('User already a participant');

    const { data: groupData } = await supabase.from('groups').select('invite_code, is_public').eq('id', groupId).single();
    if (!groupData.is_public && groupData.invite_code !== invite_code) throw new Error('Invalid invite code');

    const { data: insertedMember } = await supabase
      .from('group_participants')
      .insert([{ group_id: groupId, user_id: userId, role: 'member' }])
      .select()
      .single();

    realTimeService.broadcastGroup(groupId, {
      event: 'UPDATE',
      member: insertedMember,
    });

    return { ok: true, message: 'Joined group', role: insertedMember.role };
  } catch (err) {
    console.error('joinGroup error:', err);
    return { ok: false, message: err.message };
  }
}

async function searchGroups({ query, is_public, topic_tags, created_by, page = 1, limit = 10 }) {
  try {
    let supabaseQuery = supabase.from('groups').select('*');

    if (query) supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    if (is_public !== undefined) supabaseQuery = supabaseQuery.eq('is_public', is_public);
    if (topic_tags?.length) supabaseQuery = supabaseQuery.overlaps('topic_tags', topic_tags);
    if (created_by) supabaseQuery = supabaseQuery.eq('created_by', created_by);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data, count, error } = await supabaseQuery;
    if (error) throw error;

    return { groups: data, total: count, page, totalPages: Math.ceil(count / limit) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ------------------------------
// Export
// ------------------------------
module.exports = {
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  listGroupsOffset,
  listGroupsCursor,
  joinGroup,
  searchGroups,
};
