const express = require('express');
const router = express.Router();
const {searchBooks , getBookDetails} = require('../controllers/booksController');

router.get('/search', searchBooks);
router.get('/:id', getBookDetails);

module.exports = router;