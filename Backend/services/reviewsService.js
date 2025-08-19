const {supabase} = require('../config/supabase');
const {ensureBookInDb}=require('./booksService');

async function createReview(userId, bookId, rating, content) {
const checkId = await ensureBookInDb(bookId);

  const { data, error } = await supabase
    .from('reviews')
    .insert([
      { user_id: userId, book_id: bookId, rating, content }
    ])
    .select('id,rating,content,created_at,user:users(id, name, email)')
    .single();

  if (error) {
    if (error.code === '23505') {
      // duplicate (user_id, book_id) exists
      throw new Error('User has already reviewed this book.');
    }
    throw error; 
  }

  return data;
}

async function getReviewById(reviewId){
const {data, error} = await supabase
.from('reviews')
.select('id, rating, content, created_at, user:users(name, avatar_url)')
.eq('id', reviewId)
.single();
if(error || !data){throw new Error(`couldnt find review, error:${error.message}`)}
return data;
}


async function updateReview(reviewId, userId, rating, content){
  const updates = {};
  if(rating !== undefined) updates.rating = rating;
  if (content !== undefined) updates.content = content;

//check if review exists firsts
const{data: review, error: reviewError} = await supabase
.from('reviews')
.select('id')
.eq('id', reviewId)
.eq('user_id', userId)
.single();
if(reviewError || !review){
    throw new Error('review not found');
}
//update the review
const {data, error} = await supabase
.from('reviews')
.update(updates)
.eq('id', reviewId)
.eq('user_id', userId)
  .select(`
      id,
      rating,
      content,
      created_at,
      updated_at,
      user:users(name, avatar_url)
    `)
.single();

 if(error){
    if(error.code == 'PGRST116') throw new Error('not found');
    throw new Error (`update_failed:${error.message}`);
  }
  return data;
}
module.exports = {createReview, getReviewById, updateReview};