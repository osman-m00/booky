const { validate: isUuid } = require('uuid');
const reviewsService = require('../services/reviewsService');
const { getOrCreateUser } = require('../services/usersService');

async function createReview(req, res) {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const { bookId, rating, content } = req.body || {};

    if (!bookId || !bookId.trim()) {
      return res.status(400).json({
        error: 'missing_book_id',
        message: 'book id is required',
      });
    }

    if (rating !== undefined) {
      const n = Number(rating);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return res.status(400).json({
          error: 'invalid_rating',
          message: 'rating must be an integer between 1 and 5',
        });
      }
    }

    if (content && typeof content !== 'string') {
      return res.status(400).json({
        error: 'content_not_string',
        message: 'content must be a string',
      });
    }

    const reviewItem = await reviewsService.createReview(userId, bookId, rating, content);

    return res.status(201).json({
      ok: true,
      message: 'Review added successfully',
      item: reviewItem,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while creating the review',
    });
  }
}

async function getReview(req, res) {
  const id = req.params.id;

  if (!id) return res.status(400).json({ error: 'missing_id', message: 'Review ID required' });
  if (!isUuid(id)) return res.status(400).json({ error: 'invalid_id', message: 'Review ID must be a valid UUID' });

  try {
    const review = await reviewsService.getReviewById(id);
    if (!review) return res.status(404).json({ error: 'review_not_found', message: `No review with id ${id}` });

    return res.status(200).json({ review });
  } catch (err) {
    console.error('Get review error:', err);
    return res.status(500).json({ error: 'server_error', message: 'Failed to fetch review' });
  }
}

async function deleteReview(req, res) {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'missing_id', message: 'Review ID required' });
    if (!isUuid(id)) return res.status(400).json({ error: 'invalid_id', message: 'Review ID must be UUID' });

    const result = await reviewsService.deleteReview(id, userId);
    if (result === 'not_found') return res.status(404).json({ error: 'not_found', message: 'Review not found' });
    if (result === 'forbidden') return res.status(403).json({ error: 'forbidden', message: 'No permission' });

    return res.status(204).send();
  } catch (err) {
    console.error('Delete review error:', err);
    return res.status(500).json({ error: 'server_error', message: 'Failed to delete review' });
  }
}

async function listReviews(req, res) {
  try {
    const { bookId } = req.params || req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (!bookId) return res.status(400).json({ error: 'missing_book_id', message: 'bookId required' });
    if (!isUuid(bookId)) return res.status(400).json({ error: 'invalid_book_id', message: 'bookId must be UUID' });

    const { reviews, total } = await reviewsService.listReviews(bookId, page, limit);

    return res.status(200).json({
      ok: true,
      reviews,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('List reviews error:', err);
    return res.status(500).json({ error: 'server_error', message: 'Failed to list reviews' });
  }
}

async function updateReview(req, res) {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const reviewId = req.params.id;
    const { rating, content } = req.body || {};

    if (!reviewId) return res.status(400).json({ error: 'missing_id', message: 'Review ID required' });
    if (!isUuid(reviewId)) return res.status(400).json({ error: 'invalid_id', message: 'Review ID must be UUID' });

    if (rating !== undefined && (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'invalid_rating', message: 'Rating must be 1-5 integer' });
    }

    if (content !== undefined && (typeof content !== 'string' || content.length > 1000)) {
      return res.status(400).json({ error: 'invalid_content', message: 'Content must be string <= 1000 chars' });
    }

    const updatedReview = await reviewsService.updateReview(reviewId, userId, { rating, content });

    if (updatedReview === 'not_found') return res.status(404).json({ error: 'review_not_found', message: 'Review not found' });
    if (updatedReview === 'forbidden') return res.status(403).json({ error: 'forbidden', message: 'No permission' });

    return res.status(200).json({ ok: true, message: 'Review updated successfully', review: updatedReview });
  } catch (err) {
    console.error('Update review error:', err);
    return res.status(500).json({ error: 'server_error', message: 'Failed to update review' });
  }
}

async function searchReviews(req, res) {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    // Extract filter params from query string
    const { bookId, rating, page = 1, limit = 10 } = req.query;

    // Parse numbers
    const parsedBookId = bookId ? String(bookId) : undefined;
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;

    // Validate inputs
    if (parsedBookId !== undefined && isNaN(parsedBookId)) {
      return res.status(400).json({ error: 'invalid_bookId', message: 'Book ID must be a number' });
    }

    let parsedRating;
    if (rating !== undefined) {
      try {
        parsedRating = JSON.parse(rating); // support range { min, max }
      } catch {
        parsedRating = Number(rating);
      }

      if (typeof parsedRating === 'number' && (parsedRating < 1 || parsedRating > 5)) {
        return res.status(400).json({ error: 'invalid_rating', message: 'Rating must be 1-5' });
      }

      if (typeof parsedRating === 'object') {
        if ((parsedRating.min !== undefined && (parsedRating.min < 1 || parsedRating.min > 5)) ||
            (parsedRating.max !== undefined && (parsedRating.max < 1 || parsedRating.max > 5))) {
          return res.status(400).json({ error: 'invalid_rating_range', message: 'Rating range must be 1-5' });
        }
      }
    }

    // Call service
    const result = await reviewsService.searchReview(parsedBookId, userId, parsedRating, parsedPage, parsedLimit);

    if (!result.ok) {
      return res.status(500).json({ error: 'server_error', message: result.error });
    }

    return res.status(200).json({ ok: true, reviews: result.reviews });
  } catch (err) {
    console.error('search reviews error:', err);
    return res.status(500).json({ error: 'server_error', message: 'Failed to search reviews' });
  }
}

module.exports = {
  createReview,
  getReview,
  deleteReview,
  listReviews,
  updateReview,
  searchReviews
};
