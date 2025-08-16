const axios = require('axios');

const searchBooksFromApi = async (query) => {
    try {
            const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
    );
    const transformedBooks = response.data.items?.map(book => ({
        id: book.id,
        title: book.volumeInfo.title,
        authors: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
        description: book.volumeInfo.description || 'No description available',
        coverImage: book.volumeInfo.imageLinks?.thumbnail || null,
        publishedDate: book.volumeInfo.publishedDate,
        pageCount: book.volumeInfo.pageCount,
        rating: book.volumeInfo.averageRating
    })) || [];

    return transformedBooks;
    } catch (error) {
        throw new Error ('Failed to fetch books from external API');
    }
};


const getBookById = async (id) =>{
    try {
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`);

        const transformedBook = {
            id: response.data.id,
            title: response.data.volumeInfo.title,
            authors: response.data.volumeInfo.authors?.join(', ') || 'Unknown Author',
            description: response.data.volumeInfo.description || 'No description available',
            coverImage: response.data.volumeInfo.imageLinks?.thumbnail || null,
            publishedDate: response.data.volumeInfo.publishedDate,
            pageCount: response.data.volumeInfo.pageCount,
            rating: response.data.volumeInfo.averageRating
        };
    
        return transformedBook;
    } catch (error){
        throw new Error ('Failed to fetch book with specified ID');
    }
    
};

module.exports = {
    searchBooksFromApi,
    getBookById
}; 


