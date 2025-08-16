const {searchBooksFromApi, getBookById} = require('../services/booksService');

const searchBooks = async (req, res) => {
    try {
        const { query } = req.query;

        // Better validation
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

        res.json({
            message: `Found ${books.length} books`,
            books: books
        });
    } catch (error) {
        console.error('Search books error:', error);
        
        if (error.message.includes('Failed to fetch')) {
            return res.status(503).json({ 
                error: 'External service unavailable',
                message: 'Book search service is temporarily down'
            });
        }

        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Something went wrong on our end'
        });
    }
};

const getBookDetails = async (req, res) => {
    try {
        const id = req.params.id;

        if(!id){
            return res.status(400).json({
                error: 'id not found',
                message: 'Book with specified ID not found'
            });
        }
        if(id.trim().length<2){
            return res.status(400).json({ 
                error: 'id too short',
                message: 'id must be at least 2 characters long'
            });
        }
        const book = await getBookById(id);
        res.json({
            message: `Found book with id: ${id}`,
            book: book
        });
    } catch (error) {
        console.error('books Id error:', error);
        
        if (error.message.includes('Failed to fetch')) {
            return res.status(503).json({ 
                error: 'External service unavailable',
                message: 'Book search service is temporarily down'
            });
        }

        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Something went wrong on our end'
        });

    }
}

module.exports = {
    searchBooks,
    getBookDetails
};
