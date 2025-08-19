const express = require('express')
const router = express.Router();
const requireUser = require('../middleware/requireUser');
const { addToLibrary, listLibrary, updateLibraryItem, removeFromLibrary } = require('../controllers/libraryController');

router.use(requireUser);

router.put('/:bookId', updateLibraryItem);

router.delete('/:bookId', removeFromLibrary);

router.post('/', addToLibrary);

router.get('/', listLibrary);



module.exports = router;