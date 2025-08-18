const axios = require('axios');
const {supabase} = require('../config/supabase');


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

        const volumeInfo = response.data.volumeInfo || {};

        const identifiers = volumeInfo.industryIdentifiers || [];
        const isbn13 = identifiers.find(x => x.type === 'ISBN_13')?.identifier;
        const isbn10 = identifiers.find(x => x.type === 'ISBN_10')?.identifier;

        const transformedBook = {
            id: response.data.id,
            title: volumeInfo.title,
            authors: volumeInfo.authors?.join(', ') || 'Unknown Author',
            description: volumeInfo.description || 'No description available',
            coverImage: volumeInfo.imageLinks?.thumbnail || null,
            publishedDate: volumeInfo.publishedDate,
            pageCount: volumeInfo.pageCount,
            rating: volumeInfo.averageRating,
            language: volumeInfo.language,
            categories: volumeInfo.categories || null,
            isbn: isbn13 || isbn10 || null
        };
    
        return transformedBook;
    } catch (error){
        throw new Error ('Failed to fetch book with specified ID');
    }
    
};

const ensureBookInDb = async (bookId) =>{
    const {data: existing, error} = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

    if (existing) return existing;

    if (error && error.code!=='PGRST116'){
        throw new Error ('Failed to query books table');
    }
    const book = await getBookById(bookId)
    // Normalize published date to YYYY-MM-DD or null, since DB column is DATE
    const rawDate = book.publishedDate;
    const isoDate = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
    const row = {
        id: book.id,
        title: book.title || 'Unknown Title',         // NOT NULL
        author: book.authors || 'Unknown Author',     // NOT NULL (single string)
        description: book.description || null,
        cover_image_url: book.coverImage || null,    
        genres: Array.isArray(book.categories) ? book.categories : null,          
        isbn: book.isbn || null,
        published_date: isoDate,                      // DATE
        page_count: Number.isFinite(book.pageCount) ? book.pageCount : null,
        language: book.language || 'en',
    }

    const {data: inserted, error: insertError} = await supabase
    .from('books')
    .insert([row])
    .select('*')
    .single();
    if(insertError) throw new Error ('Failed to insert book into DB');
    return inserted
}

module.exports = {
    searchBooksFromApi,
    getBookById,
    ensureBookInDb
}; 


