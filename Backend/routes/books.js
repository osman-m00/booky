const express = require('express');
const router = express.Router();
const { searchBooks, getBookDetails } = require('../controllers/booksController');
const { clerkAuth } = require('../middleware/clerkAuth');

router.use(clerkAuth);

router.get('/search', searchBooks);
router.get('/:id', getBookDetails);

// Infinite scroll routes
router.get('/search/next', (req, res) => {
  req.query.direction = 'next';
  searchBooks(req, res);
});

router.get('/search/prev', (req, res) => {
  req.query.direction = 'prev';
  searchBooks(req, res);
});

module.exports = router;
