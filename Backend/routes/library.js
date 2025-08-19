const express = require('express')
const router = express.Router();
const requireUser = require('../middleware/requireUser');
const { addToLibrary, listLibrary } = require('../controllers/libraryController');

router.use(requireUser);

router.post('/', addToLibrary);

router.get('/', listLibrary);

module.exports = router;