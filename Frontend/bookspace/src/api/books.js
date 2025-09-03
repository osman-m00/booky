import api from './axios'; // axios instance

export const searchBooks = ({ query, limit = 10, cursor }) => {
  return api.get("/books/search", {
    params: { query, limit, cursor }
  });
};

export const searchBooksNext = ({ query, cursor, limit = 10 }) => {
  return api.get("/books/search/next", {
    params: { query, limit, cursor }
  });
};

export const searchBooksAdvanced = ({ title, author, genres, isbn, publishedDate, limit = 10, page = 1 }) => {
  return api.get("/books/search/advanced", {
    params: { title, author, genres: genres?.join(","), isbn, publishedDate, limit, page }
  });
};
