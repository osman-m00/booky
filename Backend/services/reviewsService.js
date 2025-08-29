const { supabase } = require('../config/supabase');
const { ensureBookInDb } = require('./booksService');
const { realTimeService } = require('./realtimeService'); 

async function createReview(userId, bookId, rating, content) {
  await ensureBookInDb(bookId);

  const { data, error } = await supabase
    .from('reviews')
    .insert([
      { user_id: userId, book_id: bookId, rating, content }
    ])
    .select('id, rating, content, created_at, user:users(id, name, email)')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('User has already reviewed this book.');
    }
    throw error;
  }

  realTimeService.broadcastReview(bookId, {
    event: "CREATE",
    review: data,
  });

  return data;
}

async function getReviewById(reviewId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, content, created_at, user:users(name, avatar_url)')
    .eq('id', reviewId)
    .single();

  if (error || !data) {
    throw new Error(`Could not find review, error: ${error?.message}`);
  }

  return data;
}

async function updateReview(reviewId, userId, rating, content) {
  const updates = {};
  if (rating !== undefined) updates.rating = rating;
  if (content !== undefined) updates.content = content;

  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select('id, book_id')
    .eq('id', reviewId)
    .eq('user_id', userId)
    .single();

  if (reviewError || !review) {
    throw new Error('Review not found');
  }

  const { data, error } = await supabase
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

  if (error) {
    throw new Error(`update_failed: ${error.message}`);
  }

  realTimeService.broadcastReview(review.book_id, {
    event: "UPDATE",
    review: data,
  });

  return data;
}

async function deleteReview(reviewId, userId) {
  const { data: review, error: fetchError } = await supabase
    .from("reviews")
    .select("id, book_id")
    .eq("id", reviewId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !review) {
    throw new Error("Review not found or does not belong to the user");
  }

  const { error: deleteError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error("Error deleting review");
  }

  realTimeService.broadcastReview(review.book_id, {
    event: "DELETE",
    reviewId: reviewId,
  });

  return { message: "Review deleted successfully" };
}

async function listReviews(bookId, page = 1, limit = 10, filters = {}, sort = 'newest') {
  const offset = (page - 1) * limit;

  let query = supabase
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
      { count: "exact" }
    )
    .eq("book_id", bookId);

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.rating !== undefined) {
    query = query.eq("rating", filters.rating);
  }

  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'highest':
      query = query.order('rating', { ascending: false });
      break;
    case 'lowest':
      query = query.order('rating', { ascending: true });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: reviews, error, count } = await query;
  if (error) throw new Error('Error fetching reviews');

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

async function searchReview(bookId, userId, rating, page = 1, limit = 10) {
  let query = supabase
    .from('reviews')
    .select(`
      id,
      rating,
      content,
      created_at,
      users (
        id,
        name,
        avatar_url
      ),
      books (
        id,
        title,
        author,
        description,
        cover_image_url,
        genres,
        isbn,
        language
      )
    `);

  if (bookId !== undefined) query = query.eq('book_id', bookId);
  if (userId !== undefined) query = query.eq('user_id', userId);

  if (typeof rating === 'number') {
    query = query.eq('rating', rating);
  } else if (rating && typeof rating === 'object') {
    if (rating.min !== undefined) query = query.gte('rating', rating.min);
    if (rating.max !== undefined) query = query.lte('rating', rating.max);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  try {
    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Query failed for filtering');

    return {
      ok: true,
      reviews: data.map(d => ({
        id: d.id,
        rating: d.rating,
        content: d.content,
        user: d.users,
        book: d.books,
      }))
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  createReview,
  getReviewById,
  updateReview,
  deleteReview,
  listReviews,
  searchReview
};
