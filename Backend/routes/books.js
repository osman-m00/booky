const express = require('express');
const router = express.Router();
const { searchBooks, getBookDetails } = require('../controllers/booksController');
const { clerkAuth } = require('../middleware/clerkAuth');

router.get('/search', clerkAuth, searchBooks);
router.get('/:id', clerkAuth, getBookDetails);

module.exports = router;
