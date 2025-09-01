const { getOrCreateUser } = require('../services/usersServices');
const { ensureBookInDb, getBookById, getBooksCursor, getBooksOffset, searchEnglishBooksWithPopularity } = require('../services/booksService');

// Helper: Get internal user from Clerk
async function getInternalUser(req) {
  if (!req.user) return null;
  const clerkUser = {
    id: req.user.id,
    email: req.user.claims.email,
    firstName: req.user.claims.first_name,
    lastName: req.user.claims.last_name,
    avatarUrl: req.user.claims.avatar_url,
  };
  return await getOrCreateUser(clerkUser);
}

// ----------------------------
// Search Books (Public)
// ----------------------------
const searchBooks = async (req, res) => {
  try {
    const { query, limit = 10, page = 1, cursor, direction = 'next' } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        error: 'invalid_query',
        message: 'Query must be at least 2 characters long'
      });
    }

    let result;
    let pagination = {
      page: null,
      limit: Number(limit),
      total: null,
      totalPages: null,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null
    };

    // 1️⃣ Query DB first
    if (cursor) {
      result = await getBooksCursor({ search: query, limit: Number(limit), cursor, direction });
      pagination.nextCursor = result.nextCursor;
      pagination.prevCursor = result.prevCursor;
      pagination.hasNext = !!result.nextCursor;
      pagination.hasPrev = !!result.prevCursor;
    } else {
      result = await getBooksOffset({ search: query, limit: Number(limit), page: Number(page) });
      pagination.page = Number(page);
      pagination.total = result.total;
      pagination.totalPages = result.totalPages;
      pagination.hasNext = Number(page) < result.totalPages;
      pagination.hasPrev = Number(page) > 1;
    }

    // 2️⃣ If no books in DB, fallback to Google API
    if (!result.books || result.books.length === 0) {
      const apiBooks = await searchBooksFromApi(query);

      // Optional: insert fetched books into DB
      const insertedBooks = [];
      for (const book of apiBooks) {
        const inserted = await ensureBookInDb(book.id);
        insertedBooks.push(inserted);
      }

      result.books = insertedBooks;
      pagination = {
        page: 1,
        limit: insertedBooks.length,
        total: insertedBooks.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        nextCursor: null,
        prevCursor: null
      };
    }

    res.status(200).json({
      data: result.books,
      pagination
    });

  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ error: 'internal_server_error', message: error.message });
  }
};


// ----------------------------
// Get Book Details (Optional Auth)
// ----------------------------
const getBookDetails = async (req, res) => {
  try {
    await getInternalUser(req); // optional authentication

    const id = req.params.id;

    if (!id || id.trim().length < 2) {
      return res.status(400).json({
        error: !id ? 'id_not_found' : 'id_too_short',
        message: !id ? 'Book with specified ID not found' : 'ID must be at least 2 characters long'
      });
    }

    const book = await getBookById(id);

    res.status(200).json({
      message: `Found book with id: ${id}`,
      book
    });
  } catch (error) {
    console.error('Get book by ID error:', error);

    if (error.message.includes('Failed to fetch')) {
      return res.status(503).json({ 
        error: 'external_service_unavailable',
        message: 'Book search service is temporarily down'
      });
    }

    res.status(500).json({ 
      error: 'internal_server_error',
      message: 'Something went wrong on our end'
    });
  }
};

const getFeaturedBooks = async (req, res) => {
  try {
    const query = req.query.query || 'fiction';
    const limit = Number(req.query.limit) || 4;

    const books = await searchEnglishBooksWithPopularity(query, limit);

    res.status(200).json({ data: books });
  } catch (error) {
    console.error('Get featured books error:', error);
    res.status(500).json({
      error: 'internal_server_error',
      message: error.message
    });
  }
};


module.exports = {
  searchBooks,
  getBookDetails,
  getFeaturedBooks
};
