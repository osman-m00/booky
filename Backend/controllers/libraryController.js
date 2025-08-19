const { ensureBookInDb } = require('../services/booksService');
const { addOrUpdate, listWithBooks } = require('../services/libraryService');

const VALID_STATUSES = ['want_to_read', 'currently_reading', 'completed', 'abandoned'];

const addToLibrary = async (req, res) => {
	const userId = req.userId; // from requireUser middleware
	const { bookId, status, rating, notes } = req.body || {};

	// bookId required
	if (!bookId || !bookId.trim()) {
		return res.status(400).json({
			error: 'missing_book_id',
			message: 'Book Id is required',
		});
	}

	// optional: status
	if (status && !VALID_STATUSES.includes(status)) {
		return res.status(400).json({
			error: 'invalid_status',
			message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
		});
	}

	// optional: rating 1..5 integer
	if (rating !== undefined) {
		const n = Number(rating);
		if (!Number.isInteger(n) || n < 1 || n > 5) {
			return res.status(400).json({
				error: 'invalid_rating',
				message: 'rating must be an integer between 1 and 5',
			});
		}
	}

	// optional: notes length cap
	if (notes && typeof notes !== 'string') {
		return res.status(400).json({
			error: 'invalid_notes',
			message: 'notes must be a string',
		});
	}
	if (typeof notes === 'string' && notes.length > 2000) {
		return res.status(400).json({
			error: 'notes_too_long',
			message: 'notes must be at most 2000 characters',
		});
	}

	try {
		// Task 4: Ensure book exists in DB
		await ensureBookInDb(bookId);

		// Task 5: Add/Update row in user_library
		const libItem = await addOrUpdate(userId, { bookId, status, rating, notes });

		// Return the created/updated library item
		return res.status(201).json({
			ok: true,
			message: 'Book added to library successfully',
			item: libItem
		});

	} catch (error) {
		console.error('Add to library error:', error);
		
		// Handle specific errors
		if (error.message.includes('Failed to fetch book with specified ID')) {
			return res.status(404).json({
				error: 'book_not_found',
				message: 'The requested book could not be found'
			});
		}

		res.status(500).json({
			error: 'internal_server_error',
			message: 'Something went wrong on our end'
		});
	}
};

const listLibrary = async (req, res) =>{
	const userId = req.userId; // reading user id from the middleware
	const {status} = req.query;
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) ||10;


	if (!Number.isInteger(page) || page < 1) {
		return res.status(400).json({ error: 'invalid_page', message: 'page must be an integer >= 1' });
	  }
	  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
		return res.status(400).json({ error: 'invalid_limit', message: 'limit must be 1..50' });
	  }
	  if (status && !VALID_STATUSES.includes(status)) {
		return res.status(400).json({ error: 'invalid_status', message: `status must be one of: ${VALID_STATUSES.join(', ')}` });}
	

		try {
			const {items}= await listWithBooks(userId, {status, page, limit});
			return res.status(200).json({
				ok:true,
				page,
				limit,
				status: status || null,
				items
			});
		} catch (e){
			console.error('List library error:', e);
			return res.status(500).json({
				error: 'internal server error',
				message: 'Failed to list library'
			});
		}

	  };

module.exports = { addToLibrary, listLibrary };