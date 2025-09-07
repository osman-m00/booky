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


    fetchBooks();
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

  const SkeletonCard = () => (
 <div className=" rounded-lg transform shadow-md hover:scale-102 duration-800 transition p-4 w-80 animate-pulse">
      {/* Cover image */}
      <div className="w-full h-48 object-cover rounded mb-3 border border-gray-400 bg-gray-400"/>

      {/* Title */}
      <h3 className="font-semibold text-lg mb-1"></h3>

      {/* Author */}
      <p className="text-gray-600 text-sm mb-1"></p>

      {/* Published date and page count */}
      <p className="text-gray-500 text-sm mb-1">
        
      </p>

      {/* Genres */}
        <p className="text-gray-500 text-sm mb-2"></p>
    

      {/* Optional description tooltip */}
        <p className="text-gray-700 text-sm truncate">
        </p>
    </div>
);
  return (
    <div>
      {/* Search form */}
      <h1 className="font-bold text-3xl text-center mb-10 mt-10">Search For Your Next Favorite Book</h1>
      <div className="flex flex-row justify-center">
      <form onSubmit={handleSearch} className="w-sm shadow-lg flex flex-col mb-20  rounded-lg">
        <input type="text" name="query" placeholder="Name" className="p-2"/>
        <input type="text" name="author" placeholder="Author" className="p-2"/>
        <input type="text" name="isbn" placeholder="ISBN" className="p-2"/>
        <input type="text" name="genre" placeholder="Genre" className="p-2"/>
        <div className="flex flex-row justify-center"><button type="submit" className="w-20 rounded-lg shadow-md transform transition hover:scale-105 mb-3 mt-3">Search</button></div>
      </form>
      </div>

      {/* Books grid */}
      <div className="grid grid-cols-4">
        { books
          .filter(book => book?.coverImage)
            .map(book => <BookCard key={book.id} book={book} />)}

      {loading && [1,2,3,4,5,6,7,8,9].map((m)=>(<SkeletonCard key={m}/>))}
      </div>

      {/* Sentinel div */}
      {hasMore && <div ref={sentinelRef} className="h-5"></div>}


      {/* Optional: no more results */}
      {!hasMore && books.length > 0 && <p>No more books to load.</p>}
    </div>
  );
};

export default BooksListPage;
