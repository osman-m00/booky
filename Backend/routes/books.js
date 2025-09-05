const express = require('express');
const router = express.Router();
const {
  searchBooks,
  getBookDetails,
  getFeaturedBooks,
  searchBooksAdvanced
} = require('../controllers/booksController');

// Public routes
router.get('/featured', getFeaturedBooks);
router.get('/search', searchBooks);
router.get('/search/advanced', searchBooksAdvanced);
router.get('/:id', getBookDetails);

// Cursor-based pagination (infinite scroll) for basic search
router.get('/search/next', (req, res) => {
  req.query.direction = 'next';
  searchBooks(req, res);
});
router.get('/search/prev', (req, res) => {
  req.query.direction = 'prev';
  searchBooks(req, res);
});

// Cursor-based pagination for advanced search
router.get('/search/advanced/next', (req, res) => {
  req.query.direction = 'next';
  searchBooksAdvanced(req, res);
});
router.get('/search/advanced/prev', (req, res) => {
  req.query.direction = 'prev';
  searchBooksAdvanced(req, res);
});

module.exports = router;
