import api from './axios';

// Basic search with cursor
export const searchBooks = ({ query, limit = 10, cursor }) => {
  return api.get('/books/search', {
    params: { query, limit, cursor }
  });
};

// Cursor-based next page for basic search
export const searchBooksNext = ({ query, limit = 10, cursor }) => {
  return api.get('/books/search/next', {
    params: { query, limit, cursor }
  });
};

// Advanced search (initial load, can still use page 1)
export const searchBooksAdvanced = ({ title, author, genres = [], isbn, publishedDate, limit = 10 }) => {
  const genresParam = Array.isArray(genres) ? genres.join(',') : genres;
  return api.get('/books/search/advanced', {
    params: { title, author, genres: genresParam, isbn, publishedDate, limit }
  });
};

// Cursor-based next page for advanced search
export const searchBooksAdvancedNext = ({ title, author, genres = [], isbn, publishedDate, limit = 10, cursor }) => {
  const genresParam = Array.isArray(genres) ? genres.join(',') : genres;
  return api.get('/books/search/advanced/next', {
    params: { title, author, genres: genresParam, isbn, publishedDate, limit, cursor }
  });
};

// Cursor-based previous page for advanced search
export const searchBooksAdvancedPrev = ({ title, author, genres = [], isbn, publishedDate, limit = 10, cursor }) => {
  const genresParam = Array.isArray(genres) ? genres.join(',') : genres;
  return api.get('/books/search/advanced/prev', {
    params: { title, author, genres: genresParam, isbn, publishedDate, limit, cursor }
  });
};
