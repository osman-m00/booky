// frontend: src/api/reviews.js
import api from './axios';

export const listReviews = ({ bookId, token, page = 1, limit = 10 }) => {
  return api.get(`/reviews/books/book/${bookId}`, {
    params: { page, limit },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
