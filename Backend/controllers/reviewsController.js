const { validate: isUuid } = require('uuid');
const reviewsService = require('../services/reviewsService');

const createReview = async (req, res) => {
  const userId = req.userId; // from requireUser middleware
  const { bookId, rating, content } = req.body || {};

  // Validate bookId
  if (!bookId || !bookId.trim()) {
    return res.status(400).json({
      error: 'missing_book_id',
      message: 'book id is required',
    });
  }

  // Validate rating
  if (rating !== undefined) {
    const n = Number(rating);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return res.status(400).json({
        error: 'invalid_rating',
        message: 'rating must be an integer between 1 and 5',
      });
    }
  }

  // Validate content
  if (content && typeof content !== 'string') {
    return res.status(400).json({
      error: 'content_not_string',
      message: 'content must be a string',
    });
  }

  try {
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
};

const getReview = async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      error: 'missing_id',
      message: 'Review ID must be provided in the request parameters',
    });
  }

  if (!isUuid(id)) {
    return res.status(400).json({
      error: 'invalid_id',
      message: 'Review ID must be a valid UUID',
    });
  }

  try {
    // DB/service call only inside try
    const review = await reviewsService.getReviewById(id);

    if (!review) {
      return res.status(404).json({
        error: 'review_not_found',
        message: `No review found with id: ${id}`,
      });
    }

    return res.status(200).json({
      message: `Found review with id: ${id}`,
      review,
    });
  } catch (error) {
    console.error('Get review error:', error);

    if (error.message && error.message.includes('Failed to fetch')) {
      return res.status(503).json({
        error: 'external_service_unavailable',
        message: 'Review service is temporarily down',
      });
    }

    return res.status(500).json({
      error: 'server_error',
      message: 'Something went wrong on our end',
    });
  }
};

const deleteReview = async (req, res) => {
  const id = req.params.id;
  const userId = req.userId;

  // Validate ID
  if (!id) {
    return res.status(400).json({
      error: 'missing_id',
      message: 'Review ID must be provided in the request parameters',
    });
  }

  if (!isUuid(id)) {
    return res.status(400).json({
      error: 'invalid_id',
      message: 'Review ID must be a valid UUID',
    });
  }

  try {
    const result = await reviewsService.deleteReview(id, userId);

    if (result === 'not_found') {
      return res.status(404).json({
        error: 'not_found',
        message: `No review found with id: ${id}`,
      });
    }

    if (result === 'forbidden') {
      return res.status(403).json({
        error: 'forbidden',
        message: 'You do not have permission to delete this review',
      });
    }

    // Success → no body on 204
    return res.status(204).send();

  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while deleting the review',
    });
  }
};

const listReviews = async (req, res) => {
  const bookId = req.params.bookId || req.query.bookId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  // Validate bookId
  if (!bookId) {
    return res.status(400).json({
      error: 'missing_book_id',
      message: 'bookId is required to list reviews',
    });
  }

  if (!isUuid(bookId)) {
    return res.status(400).json({
      error: 'invalid_book_id',
      message: 'bookId must be a valid UUID',
    });
  }

  // Validate page and limit
  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({
      error: 'invalid_page',
      message: 'page must be an integer >= 1',
    });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({
      error: 'invalid_limit',
      message: 'limit must be an integer between 1 and 50',
    });
  }

  try {
    const { reviews, total } = await reviewsService.listReviews(bookId, page, limit);

    return res.status(200).json({
        ok: true,
        reviews,
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
    });
  } catch (error) {
    console.error('List reviews error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Failed to list reviews',
    });
  }
};

const updateReview = async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.userId; // from auth middleware
  const { rating, content } = req.body || {};

  // Validate reviewId
  if (!reviewId) {
    return res.status(400).json({
      error: 'missing_id',
      message: 'Review ID must be provided in the request parameters',
    });
  }

  if (!isUuid(reviewId)) {
    return res.status(400).json({
      error: 'invalid_id',
      message: 'Review ID must be a valid UUID',
    });
  }

  // Validate rating if provided
  if (rating !== undefined) {
    const n = Number(rating);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return res.status(400).json({
        error: 'invalid_rating',
        message: 'Rating must be an integer between 1 and 5',
      });
    }
  }

  // Validate content if provided
  if (content !== undefined) {
    if (typeof content !== 'string') {
      return res.status(400).json({
        error: 'invalid_content',
        message: 'Content must be a string',
      });
    }
    if (content.length > 1000) { // example reasonable length limit
      return res.status(400).json({
        error: 'content_too_long',
        message: 'Content must not exceed 1000 characters',
      });
    }
  }

  try {
    const updatedReview = await reviewsService.updateReview(reviewId, userId, { rating, content });

    if (updatedReview === 'not_found') {
      return res.status(404).json({
        error: 'review_not_found',
        message: `No review found with id: ${reviewId}`,
      });
    }

    if (updatedReview === 'forbidden') {
      return res.status(403).json({
        error: 'forbidden',
        message: 'You do not have permission to update this review',
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error) {
    console.error('Update review error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'An error occurred while updating the review',
    });
  }
};

module.exports = {
  createReview,
  getReview,
  deleteReview,
  listReviews,
  updateReview
};
