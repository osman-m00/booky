const express = require('express');
const router = express.Router();
const {searchBooks } = require('../controllers/booksController');


router.get('/search', searchBooks);


module.exports = router;