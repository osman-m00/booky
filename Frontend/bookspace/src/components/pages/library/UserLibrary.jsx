import React, { useState, useEffect } from "react";
import { ListLibrary } from "../../../api/library";
import { useAuth } from "@clerk/clerk-react";
import LibraryCard from "./LibraryCard";
import LibrarySkeletonCards from "./LibrarySkeletonCards";

const UserLibrary = () => {
  // Display tabs (human-readable)
  const tabs = [
    "All Books",
    "Currently Reading",
    "Want to Read",
    "Completed",
    "Abandoned",
  ];

  // Map tab labels -> backend status keys
  const tabMap = {
    "All Books": null,
    "Currently Reading": "currently_reading",
    "Want to Read": "want_to_read",
    "Completed": "completed",
    "Abandoned": "abandoned",
  };

  const [activeTab, setActiveTab] = useState("All Books");
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId, getToken } = useAuth();

  // Fetch library
  const listlibrary = async () => {
    if (!userId) return;
    try {
      const token = await getToken();
      const res = await ListLibrary({ token });

      if (res.status === 200) {
        // ✅ backend already gives { status, rating, notes, book }
        setBooks(res.data.items);
        setLoading(false);
      }
    } catch (error) {
      console.log("Failed to fetch library items", error);
    }
  };

  useEffect(() => {
    listlibrary();
  }, []);

  // Filter when tab changes
  useEffect(() => {
    const statusKey = tabMap[activeTab];
    setFilteredBooks(
      !statusKey ? books : books.filter((item) => item.status === statusKey)
    );
  }, [activeTab, books]);

  // Remove
  const handleRemove = (id) => {
    setBooks((prev) => prev.filter((item) => item.book.id !== id));
    setFilteredBooks((prev) => prev.filter((item) => item.book.id !== id));
  };

  // Update
  const handleUpdate = (id, updatedItem) => {
    setBooks((prev) =>
      prev.map((item) => (item.book.id === id ? { ...item, ...updatedItem } : item))
    );

    setFilteredBooks((prev) =>
      prev.map((item) => (item.book.id === id ? { ...item, ...updatedItem } : item))
    );
  };

  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold mb-10">My Library</h1>

      {/* Tabs */}
      <div className="flex flex-row justify-center gap-7">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xl ${
              activeTab === tab
                ? "border-b-2 border-black font-semibold transition duration-300"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Books */}
      <div className="mt-10 grid grid-cols-4 gap-6">
        {loading
          ? [1, 2, 3, 4].map((n) => <LibrarySkeletonCards key={n} />)
          : filteredBooks.map((book) => (
              <LibraryCard
                key={book.book.id}
                book={book} // 👈 full item with {book, status, rating, notes}
                onRemove={handleRemove}
                onUpdate={handleUpdate}
              />
            ))}
      </div>
    </div>
  );
};

export default UserLibrary;
