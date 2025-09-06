const axios = require('axios');
const { supabase } = require('../config/supabase');
const { supabasePublic } = require('../config/supabase'); // use public client

const { encodeCursor, decodeCursor } = require('../utils/cursor');

// ------------------------------
// External API Functions
// ------------------------------
const searchBooksFromApi = async (query) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
    );

    return response.data.items?.map(book => ({
      id: book.id,
      title: book.volumeInfo.title,
      authors: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
      description: book.volumeInfo.description || 'No description available',
      coverImage: book.volumeInfo.imageLinks?.thumbnail || null,
      publishedDate: book.volumeInfo.publishedDate,
      pageCount: book.volumeInfo.pageCount,
      rating: book.volumeInfo.averageRating
    })) || [];
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
  const { data: existing, error } = await supabasePublic
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

  const { data: inserted, error: insertError } = await supabasePublic
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

  let query = supabasePublic
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
  let query = supabasePublic
    .from('books')
    .select('*')
    .order('created_at', { ascending: direction === 'prev' })
    .limit(limit);

  if (search) {
    query = query.ilike('title', `%${search}%`).or(`author.ilike.%${search}%`);
  }

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
// Fetch English-only books from Google API
// ------------------------------


const searchEnglishBooksWithPopularity = async (subject, limit = 8) => {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(subject)}&maxResults=${limit * 5}&langRestrict=en&printType=books&orderBy=relevance`;

    const response = await axios.get(url);

    if (!response.data.items || response.data.items.length === 0) {
      return [];
    }

    let books = response.data.items.map(book => {
      const info = book.volumeInfo;
      const avgRating = info.averageRating || 0;
      const ratingsCount = info.ratingsCount || 0;

      const popularity = avgRating * Math.log10(ratingsCount + 1);

      return {
        id: book.id,
        title: info.title,
        authors: info.authors?.join(', ') || 'Unknown Author',
        description: info.description || 'No description available',
        coverImage: info.imageLinks?.thumbnail || null,
        publishedDate: info.publishedDate,
        pageCount: info.pageCount,
        rating: avgRating,
        ratingsCount,
        popularity,
        categories: info.categories || []
      };
    });

    // Filter irrelevant stuff
    books = books.filter(b => {
      const t = b.title.toLowerCase();
      return !t.includes('catalogue') && !t.includes('subject headings');
    });

    // Sort by popularity
    books.sort((a, b) => b.popularity - a.popularity);

    return books.slice(0, limit);
  } catch (error) {
    console.error('Google Books API error:', error.response?.data || error.message);
    throw new Error('Failed to fetch featured books');
  }
};

const getBooksWithAdvancedFilters = async ({
  title,
  author,
  genres,
  isbn,
  publishedDate,
  page = 1,
  limit = 10
}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabasePublic
    .from('books')
    .select('*', { count: 'exact' })
    .range(from, to);

  // Build filters dynamically
  if (title) query = query.ilike('title', `%${title}%`);
  if (author) query = query.ilike('author', `%${author}%`);
  if (isbn) query = query.eq('isbn', isbn);
  if (publishedDate) query = query.eq('published_date', publishedDate);

  if (genres && Array.isArray(genres) && genres.length > 0) {
    query = query.contains('genres', genres);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // If no results in DB → fallback to Google
  if (!data || data.length === 0) {
    const apiBooks = await searchBooksFromApi(
      title || author || genres?.[0] || isbn || 'books'
    );

    // Save them into DB
    const insertedBooks = [];
    for (const book of apiBooks) {
      const inserted = await ensureBookInDb(book.id);
      insertedBooks.push(inserted);
    }

    return {
      books: insertedBooks,
      total: insertedBooks.length,
      page: 1,
      totalPages: 1
    };
  }

  return {
    books: data,
    total: count,
    page,
    totalPages: Math.ceil(count / limit)
  };
};

const getBooksWithAdvancedFiltersCursor = async ({
  title,
  author,
  genres,
  isbn,
  publishedDate,
  limit = 10,
  cursor = null,
  direction = 'next' // 'next' or 'prev'
}) => {
  let query = supabasePublic
    .from('books')
    .select('*')
    .order('created_at', { ascending: direction === 'prev' })
    .limit(limit);

  // Apply filters
  if (title) query = query.ilike('title', `%${title}%`);
  if (author) query = query.ilike('author', `%${author}%`);
  if (isbn) query = query.eq('isbn', isbn);
  if (publishedDate) query = query.eq('published_date', publishedDate);
  if (genres && Array.isArray(genres) && genres.length > 0) {
    query = query.contains('genres', genres);
  }

  // Handle cursor
  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    query = direction === 'next'
      ? query.lt('created_at', decodedCursor)
      : query.gt('created_at', decodedCursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  // If no results in DB → fallback to Google API
  if (!data || data.length === 0) {
    const fallbackQuery = title || author || genres?.[0] || isbn || 'books';
    const apiBooks = await searchBooksFromApi(fallbackQuery);

    const insertedBooks = [];
    for (const book of apiBooks) {
      const inserted = await ensureBookInDb(book.id);
      insertedBooks.push(inserted);
    }

    return {
      books: insertedBooks,
      nextCursor: null,
      prevCursor: null
    };
  }

  // Generate nextCursor/prevCursor
  return {
    books: data,
    nextCursor: data.length > 0 ? encodeCursor(data[data.length - 1].created_at) : null,
    prevCursor: data.length > 0 ? encodeCursor(data[0].created_at) : null
  };
};



// ------------------------------
// Fetch books from Google API (incremental, advanced filters)
// ------------------------------

/**
 * Fetch from Google Books with advanced filters.
 * - query: general text
 * - author: author name
 * - isbn: ISBN
 * - genre: subject/genre
 * - limit, startIndex: pagination
 */

/**
 * Fetch English-only books from Google Books, filling up to `limit`.
 * Keeps calling Google (advancing startIndex) until `limit` English books collected
 * or no more items are available.
 *
 * Returns: { data: [...books], nextStartIndex, hasMore }
 */

const fetchBooksFromApiIncremental = async ({
  query,
  author,
  isbn,
  genre,
  limit = 10,
  startIndex = 0
}) => {
  try {
    const parts = [];
    const trimmedQuery = query?.trim() || '';
    // If the user included explicit qualifiers like intitle:, keep them as-is.
    const hasQualifier = /(?:intitle:|inauthor:|isbn:|subject:)/i.test(trimmedQuery);

    // By default, search the title (intitle) for tighter, more relevant results.
    if (trimmedQuery) {
      parts.push(hasQualifier ? trimmedQuery : `intitle:"${trimmedQuery}"`);
    }
    if (author && author.trim()) parts.push(`inauthor:"${author.trim()}"`);
    if (isbn && isbn.trim()) parts.push(`isbn:${isbn.trim()}`);
    if (genre && genre.trim()) parts.push(`subject:"${genre.trim()}"`);

    const qString = parts.length > 0 ? parts.join('+') : 'fiction';

    const collected = [];           // English books collected for return
    let apiStart = Number(startIndex) || 0; // index we pass to Google
    let moreFromGoogle = true;

    // If you want "strict" behavior: ensure the returned books actually include the query in title or authors.
    const strictTitleSearch = Boolean(trimmedQuery && !hasQualifier);
    const qLower = trimmedQuery.toLowerCase();

    while (collected.length < limit && moreFromGoogle) {
      // Google allows maxResults up to 40 per request
      const batch = Math.min(40, limit - collected.length);

      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        qString
      )}&maxResults=${batch}&startIndex=${apiStart}&printType=books&langRestrict=en&orderBy=relevance`;

      const response = await axios.get(url);
      const items = response.data.items || [];

      if (!items.length) {
        moreFromGoogle = false;
        break;
      }

      // Keep only items with explicit language === 'en'
      const englishItems = items.filter(it => {
        const lang = it.volumeInfo?.language;
        return typeof lang === 'string' && lang.toLowerCase().startsWith('en');
      });

      // Map to your shape
      let mapped = englishItems.map(item => {
        const info = item.volumeInfo || {};
        const avgRating = info.averageRating || 0;
        const ratingsCount = info.ratingsCount || 0;
        const popularity = avgRating * Math.log10(ratingsCount + 1);

        return {
          id: item.id,
          title: info.title,
          authors: info.authors?.join(', ') || 'Unknown Author',
          description: info.description || 'No description available',
          coverImage: info.imageLinks?.thumbnail || null,
          publishedDate: info.publishedDate,
          pageCount: info.pageCount,
          rating: avgRating,
          ratingsCount,
          popularity,
          categories: info.categories || [],
          // include snippet for debugging if you want
          _searchSnippet: item.searchInfo?.textSnippet || ''
        };
      });

      // If strictTitleSearch is set, filter mapped items to those that actually contain the query
      if (strictTitleSearch) {
        mapped = mapped.filter(b => {
          const titleMatch = b.title?.toLowerCase().includes(qLower);
          const authorMatch = b.authors?.toLowerCase().includes(qLower);
          return titleMatch || authorMatch;
        });
      }

      collected.push(...mapped);

      // advance apiStart by number of items *returned by Google*
      apiStart += items.length;

      // If Google returned fewer than requested batch, likely no more items
      if (items.length < batch) {
        moreFromGoogle = false;
        break;
      }
    }

    // Trim to exactly `limit`
    const resultBooks = collected.slice(0, limit);

    const nextStartIndex = apiStart;
    // hasMore: true if we returned exactly limit and Google may still have more
    const hasMore = resultBooks.length === Number(limit) && moreFromGoogle;

    // Only sort by popularity if there's no textual query (i.e. browsing mode).
    if (!trimmedQuery) {
      resultBooks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return {
      data: resultBooks,
      nextStartIndex,
      hasMore
    };
  } catch (err) {
    console.error('Google Books API error:', err.response?.data || err.message);
    throw new Error('Failed to fetch books from Google API');
  }
};








// ------------------------------
// Exports
// ------------------------------
module.exports = {
  searchBooksFromApi,
  fetchBooksFromApiIncremental,
  getBookById,
  ensureBookInDb,
  getBooksOffset,
  getBooksCursor,
  searchEnglishBooksWithPopularity,
  getBooksWithAdvancedFilters,
  getBooksWithAdvancedFiltersCursor
};
