const { ensureBookInDb } = require('../services/booksService');
const { addOrUpdate, listWithBooks, update, deleteBook } = require('../services/libraryService');
const { getOrCreateUser } = require('../services/usersServices')

const VALID_STATUSES = ['want_to_read', 'currently_reading', 'completed', 'abandoned'];

const addToLibrary = async (req, res) => {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const { bookId, status, rating, notes } = req.body || {};

    if (!bookId || !bookId.trim()) {
      return res.status(400).json({ error: 'missing_book_id', message: 'Book Id is required' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'invalid_status',
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (rating !== undefined) {
      const n = Number(rating);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: 'invalid_rating', message: 'Rating must be 1-5 integer' });
      }
    }

    if (notes && typeof notes !== 'string') {
      return res.status(400).json({ error: 'invalid_notes', message: 'Notes must be a string' });
    }
    if (typeof notes === 'string' && notes.length > 2000) {
      return res.status(400).json({ error: 'notes_too_long', message: 'Notes must be <= 2000 chars' });
    }

    await ensureBookInDb(bookId);

    const libItem = await addOrUpdate(userId, { bookId, status, rating, notes });

    return res.status(201).json({
      ok: true,
      message: 'Book added to library successfully',
      item: libItem,
    });
  } catch (err) {
    console.error('Add to library error:', err);
    if (err.message.includes('Failed to fetch book with specified ID')) {
      return res.status(404).json({ error: 'book_not_found', message: 'Book not found' });
    }
    return res.status(500).json({ error: 'internal_server_error', message: 'Something went wrong' });
  }
};

const listLibrary = async (req, res) => {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const { status } = req.query;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;

    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'invalid_status', message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const { items } = await listWithBooks(userId, { status, page, limit });

    return res.status(200).json({ ok: true, page, limit, status: status || null, items });
  } catch (err) {
    console.error('List library error:', err);
    return res.status(500).json({ error: 'internal_server_error', message: 'Failed to list library' });
  }
};

const updateLibraryItem = async (req, res) => {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const bookId = req.params.bookId;
    const { status, rating, notes } = req.body || {};

    if (!bookId || !bookId.trim()) {
      return res.status(400).json({ error: 'missing_book_id', message: 'Book Id required' });
    }
    if (!status && rating === undefined && !notes) {
      return res.status(400).json({ error: 'missing_fields', message: 'At least one field is required' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'invalid_status', message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    if (rating !== undefined && (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'invalid_rating', message: 'Rating must be 1-5 integer' });
    }
    if (notes && (typeof notes !== 'string' || notes.length > 2000)) {
      return res.status(400).json({ error: 'invalid_notes', message: 'Notes must be string <= 2000 chars' });
    }

    const updatedItem = await update(userId, bookId, { status, rating, notes });
    return res.json(updatedItem);
  } catch (err) {
    console.error('Update library error:', err);
    if (err.message === 'not found') return res.status(404).json({ error: 'not_found', message: 'Library item not found' });
    return res.status(500).json({ error: 'update_failed', message: err.message });
  }
};

const removeFromLibrary = async (req, res) => {
  try {
    const clerkUser = {
      id: req.user.id,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name,
      avatarUrl: req.user.claims.avatar_url,
    };
    const internalUser = await getOrCreateUser(clerkUser);
    const userId = internalUser.id;

    const bookId = req.params.bookId;
    if (!bookId || !bookId.trim()) {
      return res.status(400).json({ error: 'missing_book_id', message: 'Book Id required' });
    }

    await deleteBook(userId, bookId);
    return res.status(204).send();
  } catch (err) {
    console.error('Remove from library error:', err);
    if (err.message === 'not found') return res.status(404).json({ error: 'not_found', message: 'Library item not found' });
    return res.status(500).json({ error: 'delete_failed', message: err.message });
  }
};

module.exports = { addToLibrary, listLibrary, updateLibraryItem, removeFromLibrary };
