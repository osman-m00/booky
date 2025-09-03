import { useState, useCallback } from "react";
import BookCard from "./BookCard";
import useInfiniteScroll from "../../../hooks/useInfiniteScroll";
import useCursorPagination from "../../../hooks/useCursorPagination";
import { searchBooks, searchBooksAdvanced } from "../../../api/books";

const BooksListPage = () => {
  const [query, setQuery] = useState(""); // search text
  const [filters, setFilters] = useState({ author: "", genres: [], publishedDate: "", isbn: "" });
  const [isAdvanced, setIsAdvanced] = useState(false);

  // Wrap fetch function to handle both basic and advanced searches
  const fetchFunction = useCallback(
    (params) => {
      if (isAdvanced) {
        return searchBooksAdvanced({
          title: params.title || "",
          author: params.author || "",
          genres: params.genres || [],
          isbn: params.isbn || "",
          publishedDate: params.publishedDate || "",
          limit: params.limit,
          page: params.page || 1,
        });
      } else {
        return searchBooks({
          query: params.query || "",
          limit: params.limit,
          cursor: params.cursor,
        });
      }
    },
    [isAdvanced]
  );

  const { books, loading, hasNext, loadInitial, loadMore, error } = useCursorPagination(fetchFunction, { limit: 12 });

  // Infinite scroll
  const sentinelRef = useInfiniteScroll(() => {
    if (hasNext && !loading) loadMore();
  });

  // Handlers
  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (query.trim().length < 2) return;
      setIsAdvanced(false);
      loadInitial({ query, limit: 12 });
    },
    [query, loadInitial]
  );

  const handleFilterSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setIsAdvanced(true);
      loadInitial({ ...filters, title: query, limit: 12 });
    },
    [filters, query, loadInitial]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Basic search */}
      <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search by title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-black text-white">Search</button>
      </form>

      {/* Advanced filters */}
      <form onSubmit={handleFilterSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          placeholder="Author"
          className="border rounded px-3 py-2"
          value={filters.author}
          onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
        />
        <input
          placeholder="Genres (comma separated)"
          className="border rounded px-3 py-2"
          value={filters.genres.join(",")}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, genres: e.target.value.split(",").map((g) => g.trim()) }))
          }
        />
        <input
          type="date"
          placeholder="Published Date"
          className="border rounded px-3 py-2"
          value={filters.publishedDate}
          onChange={(e) => setFilters((prev) => ({ ...prev, publishedDate: e.target.value }))}
        />
        <input
          placeholder="ISBN"
          className="border rounded px-3 py-2"
          value={filters.isbn}
          onChange={(e) => setFilters((prev) => ({ ...prev, isbn: e.target.value }))}
        />
        <button className="px-4 py-2 rounded bg-blue-600 text-white col-span-1 md:col-span-1">
          Apply Filters
        </button>
      </form>

      {/* Error */}
      {error && <div className="text-red-600 mb-4">Failed to load books.</div>}

      {/* Book grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* Loading */}
      {loading && <div className="py-4 text-center">Loading…</div>}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-6" />
    </div>
  );
};

export default BooksListPage;
