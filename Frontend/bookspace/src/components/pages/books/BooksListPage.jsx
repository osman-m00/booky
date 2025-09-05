import { useState, useEffect, useRef, useCallback } from "react";
import { listBooks } from "../../../api/books";
import BookCard from "./BookCard";

const LIMIT = 10;

const BooksListPage = () => {
  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({
    query: "fiction",
    author: "",
    isbn: "",
    genre: ""
  });
  const [startIndex, setStartIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  // synchronous flag to prevent overlapping fetches
  const isFetchingRef = useRef(false);

  // fetchBooks - memoized so useEffect/observer deps are stable
  const fetchBooks = useCallback(async () => {
    // synchronous guard
    if (!hasMore || isFetchingRef.current) return;

    isFetchingRef.current = true; // set immediately
    setLoading(true);

    try {
      const res = await listBooks({
        query: filters.query,
        author: filters.author,
        isbn: filters.isbn,
        genre: filters.genre,
        limit: LIMIT,
        startIndex
      });

      // support different response shapes: { books: [...], nextStartIndex, hasMore }
      // or { data: [...] } or { data: { data: [...] } } depending on your backend
      const maybeBooks =
        Array.isArray(res?.data?.books)
          ? res.data.books
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];

      // Append or replace if startIndex === 0
      setBooks(prev => (startIndex === 0 ? maybeBooks : [...prev, ...maybeBooks]));

      // Determine nextStartIndex
      const nextStartFromRes =
        res?.data?.nextStartIndex ?? (startIndex + maybeBooks.length);

      // Determine hasMore
      const hasMoreFromRes =
        typeof res?.data?.hasMore === "boolean"
          ? res.data.hasMore
          : maybeBooks.length === LIMIT; // if returned exactly LIMIT, there might be more

      setStartIndex(nextStartFromRes);
      setHasMore(hasMoreFromRes);
    } catch (err) {
      console.error("Error fetching books:", err);
      // optionally setHasMore(false) on certain errors if you want to stop attempts
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [filters, startIndex, hasMore]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const currentSentinel = sentinelRef.current;
    if (!currentSentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        const ent = entries[0];
        if (ent && ent.isIntersecting && !isFetchingRef.current && hasMore && !loading) {
          fetchBooks();
        }
      },
      { threshold: 1 }
    );

    observer.observe(currentSentinel);
    observerRef.current = observer;

    return () => {
      if (observerRef.current && currentSentinel) {
        observerRef.current.unobserve(currentSentinel);
      }
    };
  }, [fetchBooks, hasMore, loading]); // fetchBooks is stable via useCallback

  // When filters change -> reset pagination and fetch first page
  useEffect(() => {
    setBooks([]);
    setStartIndex(0);
    setHasMore(true);

    // trigger first fetch for the new filters
    // small microtask delay helps avoid race with observer in some edge cases,
    // but isFetchingRef prevents duplicates anyway.
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]); // we purposely don't include fetchBooks in deps to avoid double-call loops; using fetchBooks directly here is OK

  const handleSearch = e => {
    e.preventDefault();

    const formFilters = {
      query: e.target.query.value.trim(),
      author: e.target.author.value.trim(),
      isbn: e.target.isbn.value.trim(),
      genre: e.target.genre.value.trim()
    };

    if (
      !formFilters.query &&
      !formFilters.author &&
      !formFilters.isbn &&
      !formFilters.genre
    ) {
      // no-op if user submitted empty search
      return;
    }

    setFilters(formFilters);
  };

  return (
    <div>
      <h1>Books List</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ marginBottom: "20px" }}>
        <input type="text" name="query" placeholder="Search books..." />
        <input type="text" name="author" placeholder="Author" />
        <input type="text" name="isbn" placeholder="ISBN" />
        <input type="text" name="genre" placeholder="Genre" />
        <button type="submit">Search</button>
      </form>

      {/* Books grid */}
      <div
        className="books-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "20px"
        }}
      >
        {books.map(book => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* Sentinel div */}
      {hasMore && <div ref={sentinelRef} style={{ height: "20px" }}></div>}

      {/* Loading indicator */}
      {loading && <p>Loading...</p>}

      {/* Optional: no more results */}
      {!hasMore && books.length > 0 && <p>No more books to load.</p>}
    </div>
  );
};

export default BooksListPage;
