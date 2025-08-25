const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const { addToLibrary, listLibrary, updateLibraryItem, removeFromLibrary } = require('../controllers/libraryController');

// Protect all routes
router.use(clerkAuth);

router.post('/', addToLibrary);
router.get('/', listLibrary);
router.put('/:bookId', updateLibraryItem);
router.delete('/:bookId', removeFromLibrary);

module.exports = router;
