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

async function deleteReview(reviewId, userId) {
  // Step 1: Check if review exists and belongs to the user
  const { data: review, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !review) {
    throw new Error("Review not found or does not belong to the user");
  }

  // Step 2: Delete the review
  const { error: deleteError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error("Error deleting review");
  }

  // Step 3: Return success message
  return { message: "Review deleted successfully" };
}

async function listReviews(bookId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const { data: reviews, error, count } = await supabase
    .from("reviews")
    .select(
      `
      id,
      rating,
      content,
      created_at,
      users (
        id,
        name,
        avatar_url
      )
      `,
      { count: "exact" } // get total count
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: false }) // newest first
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error("Error fetching reviews");
  }

  return {
    reviews,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}


module.exports = {createReview, getReviewById, updateReview, deleteReview, listReviews};