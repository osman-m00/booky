const {supabase} = require('../config/supabase');
const { encodeCursor, decodeCursor } = require('../utils/cursor');

async function createMessage(userId, groupId, content, messageType, replyToId = null) {
  try {
    // Check if user is in the group
    const { data: existing, error: existingError } = await supabase
      .from('group_participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (existingError) throw new Error('Failed to check participants');
    if (!existing || existing.length === 0) {
      throw new Error('User is not a participant in this group');
    }

    // Validate replyToId
    if (replyToId) {
      const { data: reference, error: referenceError } = await supabase
        .from('messages')
        .select('id, group_id')
        .eq('id', replyToId)
        .single();

      if (referenceError) throw new Error('Failed to check replyTo message');
      if (!reference) throw new Error('Reply-to message not found');
      if (reference.group_id !== groupId) {
        throw new Error('Reply-to message must belong to the same group');
      }
    }

    // Insert the new message
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        group_id: groupId,
        sender_id: userId,
        content,
        message_type: messageType,
        reply_to_id: replyToId || null,
      })
      .select(`
        *,
        sender:users(id, name, avatar_url)
      `) // join sender info
      .single();

    if (insertError) throw new Error('Failed to insert message');

      realTimeService.broadcastMessage(groupId, {
      event: "CREATE",
      message: newMessage,
    });

    return newMessage;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getMessage(messageId){
try{
    const {data: messageData, error: messageError} = await supabase
    .from('messages')
    .select('*, sender:users(id, name, avatar_url)')
    .eq('id', messageId)
    .single()
    if(!messageData || messageError|| messageData.length<0){
        throw new Error('Message not found');
    }
    return messageData
}catch(error){
        console.error('Error fetching message:', error.message);

}
}

async function updateMessage(messageId, userId, content) {
  try {
    // Check if the user is the sender
    const { data: sender, error: senderError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .eq('sender_id', userId)
      .single();

    if (senderError || !sender) {
      throw new Error('User is not the sender of the message');
    }

    // Update content and mark as edited
    const { data: updatedMessage, error: updatedError } = await supabase
      .from('messages')
      .update({
        content,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select(`
        *,
        sender:users(id, name, avatar_url)
      `)
      .single();

    if (updatedError || !updatedMessage) {
      throw new Error('Failed to update message');
    }
      realTimeService.broadcastMessage(groupId, {
      event: "UPDATE",
      message: updatedMessage,
    });

    return updatedMessage;
  } catch (error) {
    console.error('Error updating message:', error.message);
    throw error;
  }
}

async function deleteMessage(messageId, userId){
    try{
    // Check if the user is the sender
    const { data: sender, error: senderError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .eq('sender_id', userId)
      .single();

    if (senderError || !sender) {
      throw new Error('User is not the sender of the message');
    }

    const{error: deleteError} = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    if(deleteError) throw new Error('Failed to delete message')

      realTimeService.broadcastMessage(groupId, {
      event: "CREATE",
      message: newMessage,
    });
        return {ok: true, message: 'Message deleted successfully'}
    }catch(error){
    console.error('Error deleting message:', error.message);
    throw error;
    }
}

async function listMessages({ groupId, userId, limit = 20, cursor = null, direction = 'next', replyToId = null }) {
  try {
    if (direction !== 'next' && direction !== 'prev') {
      throw new Error("Invalid direction; must be 'next' or 'prev'");
    }

    const { data: existing, error: existingError } = await supabase
      .from('group_participants')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (existingError) throw new Error('Failed to check participants');
    if (!existing || existing.length === 0) throw new Error('User is not a participant in this group');

    let query = supabase
      .from('messages')
      .select(`*, sender:users(id, name, avatar_url)`, { count: 'exact' })
      .eq('group_id', groupId)
      .order('created_at', { ascending: direction === 'prev' }) // older first for next, newer first for prev
      .limit(limit);

    if (replyToId) query = query.eq('reply_to_id', replyToId);

    let cursorValue = cursor ? decodeCursor(cursor) : null;
    if (cursorValue) {
      query = direction === 'next'
        ? query.lt('created_at', cursorValue) // older messages
        : query.gt('created_at', cursorValue); // newer messages
    }

    const { data: messages, error, count } = await query;
    if (error) throw new Error('Failed to fetch messages');

    const nextCursor = messages.length ? encodeCursor(messages[messages.length - 1].created_at) : null;
    const prevCursor = messages.length ? encodeCursor(messages[0].created_at) : null;

    return {
      messages,
      pagination: {
        total: count,
        limit,
        direction,
        nextCursor,
        prevCursor,
      }
    };
  } catch (err) {
    console.error('Error listing messages:', err.message);
    throw err;
  }
}


async function markMessageAsRead(messageId, userId) {
  try {
    // Get current read_by
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('read_by')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) throw new Error('Message not found');

    const readBy = message.read_by || [];
    if (!readBy.includes(userId)) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_by: [...readBy, userId] })
        .eq('id', messageId);

      if (updateError) throw new Error('Failed to mark message as read');
    }

    return { ok: true, message: 'Message marked as read' };
  } catch (err) {
    console.error('Error marking message as read:', err.message);
    throw err;
  }
}

module.exports = {createMessage, getMessage, updateMessage, deleteMessage, listMessages, markMessageAsRead}