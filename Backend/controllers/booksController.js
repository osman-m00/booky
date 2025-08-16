const {searchBooksFromApi} = require('../services/booksService');

const searchBooks = async (req, res) => {
    try {
        const {query} = req.query;

        if (!query) {
            return res.status(400).json({error: 'Query parameter is required'});
        }

        const books = await searchBooksFromApi(query);

        res.json({
            message: `Found ${books.length} books`, 
            books: books
        });
    } catch (error) {
        res.status(500).json({error: 'Failed to search books', details: error.message});
    }
};

module.exports = {
    searchBooks
};
