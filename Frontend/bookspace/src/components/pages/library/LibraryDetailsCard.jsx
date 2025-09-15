import React, { useState } from "react";
import { removeFromLibrary, updateLibraryItem } from "../../../api/library";

const LibraryDetailsCard = ({ book, getToken, userId, onRemove, onUpdate }) => {
  const { id, title, author, cover_image_url, description } = book.book;
  const { status, rating, notes } = book;

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [editStatus, setEditStatus] = useState(status || "want_to_read");
  const [editRating, setEditRating] = useState(rating || 0);
  const [editNotes, setEditNotes] = useState(notes || "");

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


  const saveUpdates = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!userId || !token) return;

    const res = await updateLibraryItem({
      bookId: id,
      status: editStatus,
      rating: editRating,
      notes: editNotes,
      token,
    });

        onUpdate(id, res.data); // let parent update its state
        setIsEditing(false);
      
    } catch (error) {
      console.log("Failed to update book, error: ", error);
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

      {/* Editable Section */}
      {isEditing ? (
        <div className="space-y-3 text-sm">
          {/* Status */}
          <div>
            <label className="block font-semibold mb-1">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="border rounded w-full p-2"
            >
              <option value="want_to_read">Want to Read</option>
              <option value="currently_reading">Currently Reading</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block font-semibold mb-1">Rating (1–5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={editRating}
              onChange={(e) => setEditRating(Number(e.target.value))}
              className="border rounded w-full p-2"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold mb-1">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="border rounded w-full p-2"
              rows="3"
            />
          </div>
        </div>
      ) : (
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
      )}

      {/* Buttons */}
      <div className="flex justify-between mt-6">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border rounded"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={saveUpdates}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow"
            >
              Update
            </button>
            <button
              onClick={removeFunction}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
            >
              {loading ? "Removing..." : "Remove"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LibraryDetailsCard;
