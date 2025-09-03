// src/components/cards/BookCard.jsx
import React from "react";

const BookCard = ({ book }) => {
  const {
    cover_image_url,
    title,
    author,
    genres,
    published_date,
    page_count,
    description
  } = book;

  // Format published date nicely
  const formattedDate = published_date ? new Date(published_date).toLocaleDateString() : "N/A";

  return (
    <div className="border rounded shadow hover:shadow-lg transition p-4 flex flex-col">
      {/* Cover image */}
      <img
        src={cover_image_url || "/placeholder-book.png"} // fallback image
        alt={title}
        className="w-full h-48 object-cover rounded mb-3"
      />

      {/* Title */}
      <h3 className="font-semibold text-lg mb-1">{title}</h3>

      {/* Author */}
      <p className="text-gray-600 text-sm mb-1">by {author}</p>

      {/* Published date and page count */}
      <p className="text-gray-500 text-sm mb-1">
        Published: {formattedDate} | {page_count || "?"} pages
      </p>

      {/* Genres */}
      {genres && genres.length > 0 && (
        <p className="text-gray-500 text-sm mb-2">
          Genres: {genres.join(", ")}
        </p>
      )}

      {/* Optional description tooltip */}
      {description && (
        <p className="text-gray-700 text-sm truncate" title={description}>
          {description.length > 100 ? description.slice(0, 100) + "..." : description}
        </p>
      )}
    </div>
  );
};

export default BookCard;
