import React, { useState } from 'react';
import { addToLibrary } from '../../../api/library';
import { Loader2 } from "lucide-react"; 

const AddToLibraryForm = ({ bookId, getToken, onClose, onSuccess }) => {
  const [rating, setRating] = useState(3); // default rating
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formValues = {
        status: e.target.status.value.trim(),      // already string
        rating: Number(rating),                    // convert to number
         notes: e.target.notes.value.trim().slice(0, 2000)
    };

    try {
      const token = await getToken();
      const res = await addToLibrary({ bookId: String(bookId), ...formValues, token });
      if (res.status === 201) onSuccess(); // close modal and update parent
    } catch (error) {
      console.error('Failed to add to library:', error);
      console.error('Status:', error.response?.status);
      console.error('Body:', error.response?.data);
    } finally {
        setLoading(false)
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Status */}
        <div className="mb-4 flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Status</label>
          <select
            name="status"
            defaultValue="want_to_read"
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
          <option value="currently_reading">Currently Reading</option>
          <option value="want_to_read">Want to Read</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
          </select>
        </div>

        {/* Rating */}
        <div className="mb-4 flex items-center gap-3">
          <label className="font-medium text-gray-700">Rating</label>
          <input
            type="range"
            name="range"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-6 text-center">{rating}</span>
        </div>

        {/* Notes */}
        <div className="mb-4 flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            rows={6}
            placeholder="Add your notes..."
            className="border rounded p-3 w-full mb-2 resize-y placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {loading ? (<Loader2 className='w-5 h-5 animate-spin'/>) : ('Submit')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddToLibraryForm;
