const { searchBooksFromApi, getBookById } = require('../services/booksService');
const { getOrCreateUser } = require('../services/usersService');

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

const searchBooks = async (req, res) => {
  try {
    // Optional: get user if authentication is required in future
    await getInternalUser(req);

    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter is required',
        message: 'Please provide a search term'
      });
    }

    if (query.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Query too short',
        message: 'Search term must be at least 2 characters long'
      });
    }

    const books = await searchBooksFromApi(query);

    res.status(200).json({
      message: `Found ${books.length} books`,
      books
    });
  } catch (error) {
    console.error('Search books error:', error);

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

const getBookDetails = async (req, res) => {
  try {
    // Optional: get user if authentication is required in future
    await getInternalUser(req);

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

module.exports = {
  searchBooks,
  getBookDetails
};
