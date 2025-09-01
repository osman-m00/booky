import React, { useEffect, useState } from "react";
import axios from "axios";

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

  if (loading) {
    return <p className="text-center py-16">Loading books...</p>;
  }

  if (books.length === 0) {
    return <p className="text-center py-16">No books found.</p>;
  }

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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
            {books.map((book) => (
              <div
                key={book.id}
                className="flex flex-col items-center border border-gray-500 rounded-lg p-4 transform transition duration-200 hover:scale-105 w-60"
              >
                <div className="w-24 h-36 bg-gray-300 rounded mb-2">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <p className="font-semibold text-center">{book.title}</p>
                <p className="text-sm text-gray-500 text-center">{book.authors}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col items-center">
          <p className="mb-4 text-lg font-medium text-center">
            He got recommended this:
          </p>
          {recommended ? (
            <div className="flex flex-col items-center border border-gray-500 rounded-lg p-4 transform transition duration-200 hover:scale-105 w-60">
              <div className="w-24 h-36 bg-gray-300 rounded mb-2">
                {recommended.coverImage ? (
                  <img
                    src={recommended.coverImage}
                    alt={recommended.title}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <p className="font-semibold text-center">{recommended.title}</p>
              <p className="text-sm text-gray-500 text-center">{recommended.authors}</p>
            </div>
          ) : (
            <p>Loading recommended book...</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBooks;
