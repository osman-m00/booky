import { useState, useCallback } from "react";
import BookCard from "./BookCard";
import useInfiniteScroll from "../../../hooks/useInfiniteScroll";
import useCursorPagination from "../../../hooks/useCursorPagination";
import {
  searchBooks,
  searchBooksAdvanced,
  searchBooksAdvancedNext
} from "../../../api/books";

const allGenres = ["Fiction", "Non-fiction", "Fantasy", "Science", "Biography", "History"];

const BooksListPage = () => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ author: "", genres: [], publishedDate: "", isbn: "" });
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [lastParams, setLastParams] = useState(null); // store params for loadMore

  // Unified fetch function
  const fetchBooks = useCallback(
    (params) => {
      if (isAdvanced) {
        return params.cursor
          ? searchBooksAdvancedNext({ ...params }) // cursor-based
          : searchBooksAdvanced({ ...params }); // initial load
      } else {
        return searchBooks({ ...params }); // basic search
      }
    },
    [isAdvanced]
  );

  const { books, loading, hasNext, loadInitial, loadMore, error } = useCursorPagination(fetchBooks);
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNext && !loading && lastParams) loadMore(lastParams);
  });

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!query || query.trim().length < 2) return;

      setIsAdvanced(false);
      const params = { query, limit: 12 };
      setLastParams(params);
      loadInitial(params);
    },
    [query, loadInitial]
  );

  const handleFilterSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setIsAdvanced(true);

      const params = { ...filters, title: query, limit: 12 };
      setLastParams(params);
      loadInitial(params);
    },
    [filters, query, loadInitial]
  );

  const toggleGenre = (genre) => {
    setFilters((prev) => {
      const newGenres = prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres: newGenres };
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
        <input
          placeholder="Search by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <button className="px-4 py-2 rounded bg-black text-white">Search</button>
      </form>

      <form onSubmit={handleFilterSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          placeholder="Author"
          value={filters.author}
          onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
          className="border rounded px-3 py-2"
        />
        <div className="flex flex-wrap gap-2 col-span-1 md:col-span-1">
          {allGenres.map((genre) => (
            <label key={genre} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.genres.includes(genre)}
                onChange={() => toggleGenre(genre)}
              />
              {genre}
            </label>
          ))}
        </div>
        <input
          type="date"
          placeholder="Published Date"
          value={filters.publishedDate}
          onChange={(e) => setFilters((prev) => ({ ...prev, publishedDate: e.target.value }))}
          className="border rounded px-3 py-2"
        />
        <input
          placeholder="ISBN"
          value={filters.isbn}
          onChange={(e) => setFilters((prev) => ({ ...prev, isbn: e.target.value }))}
          className="border rounded px-3 py-2"
        />
        <button className="px-4 py-2 rounded bg-blue-600 text-white col-span-1 md:col-span-1">Apply Filters</button>
      </form>

      {error && <div className="text-red-600 mb-4">Failed to load books.</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {loading && <div className="py-4 text-center">Loading…</div>}

      <div ref={sentinelRef} className="h-6" />
    </div>
  );
};

export default BooksListPage;
