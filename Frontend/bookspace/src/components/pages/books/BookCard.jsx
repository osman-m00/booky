// src/components/cards/BookCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const BookCard = ({ book }) => {
    const navigate = useNavigate(); // <-- initialize navigate

  const {
    coverImage,
    title,
    authors,
    genres,
    publishedDate,
    pageCount,
    description
  } = book;

  // Format published date nicely
  const formattedDate = publishedDate ? new Date(publishedDate).toLocaleDateString() : "N/A";

  return (
    <div onClick={()=> navigate(`/books/${book.id}`)}>
    <div className=" rounded-lg transform shadow-md hover:scale-102 duration-800 transition p-4 flex flex-col w-80">
      {/* Cover image */}
      <img
        src={coverImage || "/placeholder-book.png"} // fallback image
        alt={title}
        className="w-full h-48 object-cover rounded mb-3 border border-gray-400"
      />

      {/* Title */}
      <h3 className="font-semibold text-lg mb-1">{title}</h3>

      {/* Author */}
      <p className="text-gray-600 text-sm mb-1">by {authors}</p>

      {/* Published date and page count */}
      <p className="text-gray-500 text-sm mb-1">
        Published: {formattedDate} | {pageCount || "?"} pages
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
    </div>
  );
};

export default BookCard;
