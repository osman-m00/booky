const express = require('express')
const router = express.Router();
const requireUser = require('../middleware/requireUser');
const { addToLibrary } = require('../controllers/libraryController');

router.use(requireUser);

router.post('/', addToLibrary);

module.exports = router;