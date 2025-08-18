const { supabase } = require('../config/supabase');

async function addOrUpdate(userId, {bookId, status, rating, notes}){
    const row = { user_id: userId, book_id: bookId };
    if (status !== undefined) row.status = status;
    if (rating !== undefined) row.rating = rating;
    if (notes !== undefined) row.notes = notes;
    
    const { data, error } = await supabase
    .from('user_library')
    .upsert(row, { onConflict: 'user_id,book_id' })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to upsert user_library: ${error.message}`);
  return data;
}

module.exports = { addOrUpdate };