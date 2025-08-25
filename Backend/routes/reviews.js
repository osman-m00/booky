const express = require('express');
const router = express.Router();
const requireUser = require('../middleware/requireUser');
const { clerkAuth } = require('../middleware/clerkAuth');

const { createReview, getReview, deleteReview, listReviews, updateReview} = require('../controllers/reviewsController');

router.use(clerkAuth);
router.post('/',createReview);
router.get('/:id', getReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.get('/book/:bookId', listReviews);

module.exports = router;


