// controllers/reviewsController.js
import { validate as isUuid } from 'uuid';
import * as reviewsService from '../services/reviewsService.js';
import { getOrCreateUser } from '../services/usersService.js';
import { realTimeService } from '../services/realtimeService.js';

export async function createReview(req, res) {
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
      return res.status(400).json({ error: 'missing_book_id', message: 'book id is required' });
    }

    if (rating !== undefined) {
      const n = Number(rating);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: 'invalid_rating', message: 'rating must be an integer between 1 and 5' });
      }
    }

    if (content && typeof content !== 'string') {
      return res.status(400).json({ error: 'content_not_string', message: 'content must be a string' });
    }

    const reviewItem = await reviewsService.createReview(userId, bookId, rating, content);

    // Broadcast real-time insert
    realTimeService.broadcastReview(bookId, {
      event: 'INSERT',
      review: reviewItem
    });

    return res.status(201).json({
      ok: true,
      message: 'Review added successfully',
      item: reviewItem,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ error: 'server_error', message: 'An error occurred while creating the review' });
  }
}

export async function getReview(req, res) {
  try {
    const id = req.params.id;
    if (!id || !isUuid(id)) return res.status(400).json({ error: 'invalid_id', message: 'Review ID must be a valid UUID' });

    const review = await reviewsService.getReviewById(id);
    if (!review) return res.status(404).json({ error: 'review_not_found', message: `No review with id ${id}` });

    return res.status(200).json({ review });
  } catch (err) {
    console.error('Get review error:', err);
    return res.status(500).json({ error: 'server_error', message: 'Failed to fetch review' });
  }
}

export async function deleteReview(req, res) {
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
    if (!id || !isUuid(id)) return res.status(400).json({ error: 'invalid_id', message: 'Review ID must be UUID' });

    // Fetch review to get bookId before deletion
    const review = await reviewsService.getReviewById(id);
    if (!review) return res.status(404).json({ error: 'not_found', message: 'Review not found' });
    const bookId = review.book_id;

    const result = await reviewsService.deleteReview(id, userId);

    // Broadcast deletion
    realTimeService.broadcastReview(bookId, {
      event: 'DELETE',
      reviewId: id
    });

    if (result === 'forbidden') return res.status(403).json({ error: 'forbidden', message: 'No permission' });

    return res.status(204).send();
  } catch (err) {
    console.error('Delete review error:', err);
    return res.status(500).json({ error: 'server_error', message: 'Failed to delete review' });
  }
}

export async function updateReview(req, res) {
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

    if (!reviewId || !isUuid(reviewId)) return res.status(400).json({ error: 'invalid_id', message: 'Review ID must be UUID' });

    if (rating !== undefined && (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'invalid_rating', message: 'Rating must be 1-5 integer' });
    }

    if (content !== undefined && (typeof content !== 'string' || content.length > 1000)) {
      return res.status(400).json({ error: 'invalid_content', message: 'Content must be string <= 1000 chars' });
    }

    // Fetch review to get bookId before update
    const review = await reviewsService.getReviewById(reviewId);
    if (!review) return res.status(404).json({ error: 'review_not_found', message: 'Review not found' });
    const bookId = review.book_id;

    const updatedReview = await reviewsService.updateReview(reviewId, userId, { rating, content });

    // Broadcast update
    realTimeService.broadcastReview(bookId, {
      event: 'UPDATE',
      review: updatedReview
    });

    if (updatedReview === 'forbidden') return res.status(403).json({ error: 'forbidden', message: 'No permission' });

    return res.status(200).json({ ok: true, message: 'Review updated successfully', review: updatedReview });
  } catch (err) {
    console.error('Update review error:', err);
    return res.status(500).json({ error: 'server_error', message: 'Failed to update review' });
  }
}

export async function listReviews(req, res) {
  try {
    const { bookId } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (!bookId || !isUuid(bookId)) return res.status(400).json({ error: 'invalid_book_id', message: 'bookId must be UUID' });

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

export async function searchReviews(req, res) {
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

    const { bookId, rating, page = 1, limit = 10 } = req.query;

    let parsedRating;
    if (rating !== undefined) {
      try {
        parsedRating = JSON.parse(rating);
      } catch {
        parsedRating = Number(rating);
      }
    }

    const result = await reviewsService.searchReview(bookId, userId, parsedRating, Number(page), Number(limit));

    if (!result.ok) return res.status(500).json({ error: 'server_error', message: result.error });

    return res.status(200).json({ ok: true, reviews: result.reviews });
  } catch (err) {
    console.error('search reviews error:', err);
    return res.status(500).json({ error: 'server_error', message: 'Failed to search reviews' });
  }
}
