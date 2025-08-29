const axios = require('axios');
const { supabase } = require('../config/supabase');
const { encodeCursor, decodeCursor } = require('../utils/cursor');

// ------------------------------
// External API Functions
// ------------------------------

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
    throw new Error('Failed to fetch books from external API');
  }
};

const getBookById = async (id) => {
  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`);
    const volumeInfo = response.data.volumeInfo || {};

    const identifiers = volumeInfo.industryIdentifiers || [];
    const isbn13 = identifiers.find(x => x.type === 'ISBN_13')?.identifier;
    const isbn10 = identifiers.find(x => x.type === 'ISBN_10')?.identifier;

    return {
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
  } catch (error) {
    throw new Error('Failed to fetch book with specified ID');
  }
};

// ------------------------------
// DB Functions
// ------------------------------

const ensureBookInDb = async (bookId) => {
  const { data: existing, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (existing) return existing;

  if (error && error.code !== 'PGRST116') throw new Error('Failed to query books table');

  const book = await getBookById(bookId);
  const rawDate = book.publishedDate;
  const isoDate = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;

  const row = {
    id: book.id,
    title: book.title || 'Unknown Title',
    author: book.authors || 'Unknown Author',
    description: book.description || null,
    cover_image_url: book.coverImage || null,
    genres: Array.isArray(book.categories) ? book.categories : null,
    isbn: book.isbn || null,
    published_date: isoDate,
    page_count: Number.isFinite(book.pageCount) ? book.pageCount : null,
    language: book.language || 'en'
  };

  const { data: inserted, error: insertError } = await supabase
    .from('books')
    .insert([row])
    .select('*')
    .single();

  if (insertError) throw new Error('Failed to insert book into DB');
  return inserted;
};

// ------------------------------
// Offset-Based Pagination
// ------------------------------

const getBooksOffset = async ({ page = 1, limit = 10, search = '' }) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('books')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike('title', `%${search}%`).or(`author.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    books: data,
    total: count,
    page,
    totalPages: Math.ceil(count / limit)
  };
};

// ------------------------------
// Cursor-Based Pagination
// ------------------------------

const getBooksCursor = async ({ limit = 10, cursor = null, direction = 'next', search = '' }) => {
  let query = supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: direction === 'prev' })
    .limit(limit);

  // Apply search filter
  if (search) {
    query = query.ilike('title', `%${search}%`).or(`author.ilike.%${search}%`);
  }

  // Apply cursor if provided
  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    query = direction === 'next' ? query.lt('created_at', decodedCursor) : query.gt('created_at', decodedCursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    books: data,
    nextCursor: data.length > 0 ? encodeCursor(data[data.length - 1].created_at) : null,
    prevCursor: data.length > 0 ? encodeCursor(data[0].created_at) : null,
  };
};


// ------------------------------
// Exported Functions
// ------------------------------

module.exports = {
  searchBooksFromApi,
  getBookById,
  ensureBookInDb,
  getBooksOffset,
  getBooksCursor
};
