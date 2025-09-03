import React, { useEffect, useState } from "react";
import axios from "axios";

const SkeletonCard = () => (
  <div className="flex flex-col items-center border border-gray-300 rounded-lg p-4 w-60 h-60 animate-pulse">
    <div className="w-24 h-36 bg-gray-300 rounded mb-2" />
    <div className="h-4 w-32 bg-gray-300 rounded mb-1" />
    <div className="h-3 w-20 bg-gray-200 rounded" />
  </div>
);

const FeaturedBooks = () => {
  const [books, setBooks] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/books/featured?query=fiction&limit=4"
        );
        const fetchedBooks = res.data.data || [];
        setBooks(fetchedBooks.slice(0, 3));
        setRecommended(fetchedBooks[3] || null);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  return (
    <section className="py-16">
      <h2 className="text-center text-3xl font-bold mb-8">
        Find Books based on your preferences
      </h2>

      <div className="grid grid-cols-2 gap-16 items-start">
        {/* Left Column */}
        <div className="flex flex-col">
          <p className="mb-4 text-lg font-medium text-center">
            Because Adam liked these:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-55 ml-30 justify-items-center">
            {loading
? [1, 2, 3].map((i) => <SkeletonCard key={i} />): books.map((book) => (
                  <div
                    key={book.id}
                    className="flex flex-col items-center shadow-md rounded-lg p-4 transform transition duration-200 hover:scale-105 w-60 h-60 opacity-0 animate-fadeIn"
                  >
                    <div className="w-24 h-36 bg-gray-300 rounded mb-2 flex-shrink-0">
                      {book.coverImage && (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="font-semibold text-center text-sm line-clamp-2">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-500 text-center line-clamp-1">
                      {book.authors}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col items-center">
          <p className="mb-4 text-lg font-medium text-center">
            He got recommended this:
          </p>
          {loading ? (
            <SkeletonCard />
          ) : recommended ? (
            <div className="flex flex-col items-center shadow-md rounded-lg p-4 transform transition duration-200 hover:scale-105 w-60 h-60 opacity-0 animate-fadeIn">
              <div className="w-24 h-36 bg-gray-300 rounded mb-2 flex-shrink-0">
                {recommended.coverImage && (
                  <img
                    src={recommended.coverImage}
                    alt={recommended.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <p className="font-semibold text-center text-sm line-clamp-2">
                {recommended.title}
              </p>
              <p className="text-xs text-gray-500 text-center line-clamp-1">
                {recommended.authors}
              </p>
            </div>
          ) : (
            <p>No recommendation found.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBooks;
