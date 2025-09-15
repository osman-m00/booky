import React, { useState } from "react";
import { removeFromLibrary } from "../../../api/library";

const LibraryDetailsCard = ({ book, getToken, userId, onRemove }) => {
  const { id, title, author, cover_image_url, description, } = book.book;
  const {status, rating, notes} = book;
  const [loading, setLoading] = useState(false);

  const removeFunction = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!userId || !token) return;

      const res = await removeFromLibrary({ bookId: id, token });
      if (res.status === 204) {
        onRemove(id);
      }
    } catch (error) {
      console.log("Failed to remove book from library, error: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      {/* Title */}
      <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>

      {/* Image */}
      <div className="flex justify-center mb-4">
        <img
          src={cover_image_url}
          alt={title}
          className="h-48 w-auto object-cover rounded-md shadow"
        />
      </div>

      {/* Author */}
      <p className="text-gray-600 text-center mb-4">by {author}</p>

      {/* Description */}
      {description && (
        <p className="text-gray-800 text-sm mb-6 line-clamp-6">{description}</p>
      )}

      {/* Extra details */}
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-semibold">Status:</span>{" "}
          {status || "Not set"}
        </p>
        <p>
          <span className="font-semibold">Rating:</span>{" "}
          {rating ? `${rating}/5` : "Not rated"}
        </p>
        <p>
          <span className="font-semibold">Notes:</span>{" "}
          {notes || "No notes yet"}
        </p>
      </div>

      {/* Remove button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={removeFunction}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
        >
          {loading ? "Removing..." : "Remove from Library"}
        </button>
      </div>
    </div>
  );
};

export default LibraryDetailsCard;
