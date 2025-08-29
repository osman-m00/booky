const {supabase} = require('../config/supabase');

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

async function listMessages(groupId, userId, page = 1, limit = 20, replyToId = null) {
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

    // Pagination math
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Build query with count
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users(id, name, avatar_url)
      `, { count: 'exact' }) // <-- tells Supabase to return row count
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .range(start, end);

    if (replyToId) {
      query = query.eq('reply_to_id', replyToId);
    }

    const { data: messages, error: messagesError, count } = await query;

    if (messagesError) throw new Error('Failed to fetch messages');

    return {
      messages,
      pagination: {
        page,
        limit,
        total: count,                        // total number of matching rows
        totalPages: Math.ceil(count / limit) // total pages available
      }
    };
  } catch (error) {
    console.error('Error listing messages:', error.message);
    throw error;
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