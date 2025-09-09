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

async function listLibrary(userId, {status, page, limit}){
  const offset = (page -1) * limit;

  let query =  supabase
  .from('user_library')
  .select('*')
  .eq('user_id', userId)
  .order('added_at', {ascending: false})
  .range(offset, offset + limit -1)
  if (status) {
    query = query.eq('status',status);
  }
  const {data, error} = await query;
  if(error) throw new Error(`Failed to fetch page: ${error.message}`);
  return data;
}

async function listWithBooks(userId, params){
  const rows = await listLibrary(userId, params);
  if (!rows || rows.length === 0) return { items: [] };

  const bookIds = [...new Set(rows.map(r=>r.book_id))];

  const {data: books, error: booksError} = await supabase
  .from('books')
  .select('id,title,author,cover_image_url,genres,isbn,published_date, page_count,language')
  .in('id', bookIds);

  if(booksError) throw new Error(`Failed to fetch books: ${booksError.message}`);

  const booksById = new Map((books || []).map(b => [b.id, b]));

  const items = rows.map(r => ({
    id: r.id,
    bookId: r.book_id,
    status: r.status,
    rating: r.rating,
    notes: r.notes,
    addedAt: r.added_at,
    updatedAt: r.updated_at,
    book: booksById.get(r.book_id) || null
  }));

  return {items};
}

async function update(userId, bookId, {status, rating, notes}){
  const updates = {};
  if(status !== undefined) updates.status = status;
  if (rating !== undefined) updates.rating = rating;
  if (notes !== undefined) updates.notes = notes;

  const {data, error} = await supabase
  .from('user_library')
  .update(updates)
  .eq('user_id', userId)
  .eq('book_id', bookId)
  .select('*')
  .single();
  
  if(error){
    if(error.code == 'PGRST116') throw new Error('not found');
    throw new Error (`update_failed:${error.message}`);
  }
  return data;
}

async function deleteBook(userId, bookId) {
  const { data, error } = await supabase
    .from('user_library')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .select();
    

  if (error) {
    throw new Error(`Failed to delete library item: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // Nothing deleted → item not found
    throw new Error('not_found');
  }

  return true; // successfully deleted
}


async function checkBookInLibrary(userId, bookId) {
  const { data, error } = await supabase
    .from('user_library')
    .select('book_id')
    .eq('user_id', userId)  
    .eq('book_id', bookId)
    .single();

  if (error || !data) {
    throw new Error('This book is not present in the library');
  }

  return true;
}

module.exports = { addOrUpdate, listLibrary, listWithBooks, update, deleteBook, checkBookInLibrary };