import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bookDetails } from '../../../api/books';
import { SignedIn, useAuth } from "@clerk/clerk-react";
import { addToLibrary as addToLibraryApi } from '../../../api/library'; // renamed import

const BookDetailsPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [addedToLibrary, setAddedToLibrary] = useState(false); 
  const { getToken, userId } = useAuth();


  const getBookDetails = async (id) => {
    try {
      const res = await bookDetails(id);
      setBook(res.data.book);
    } catch (error) {
      console.log('Failed to fetch book by id in Book Details page', error);
    }
  };

  const addToLibraryHandler = async () => {
    if (!userId) return; // not signed in
  try {
    const token = await getToken(); // short-lived Clerk token
    const res = await addToLibraryApi({bookId: id, token});
    if (res.status === 201) setAddedToLibrary(true);
  } catch (error) {
      console.error('Failed to add book to library:', error);
    } 
  };

  useEffect(() => {
    getBookDetails(id);
  }, [id]);

  if (!book) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-56 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-md mt-5">
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold leading-tight">{book.title}</h1>
        <p className="text-lg text-gray-600 mt-1">{book.authors}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={book.coverImage}
          alt={`${book.title} cover`}
          className="w-full max-w-[220px] h-56 object-cover rounded-lg shadow-md flex-shrink-0"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder-book.png';
          }}
        />

        <div className="flex-1 flex flex-col justify-start">
          <div className="text-sm text-gray-500 mb-3">
            <span className="block">Published: <span className="text-gray-700 font-medium">{book.publishedDate}</span></span>
            <span className="block mt-1">{book.pageCount} pages</span>
          </div>

          <div className="mb-4">
            <p className="font-semibold text-sm text-gray-800 mb-1">Genres</p>
            <p className="text-sm text-gray-700">
              {book.categories
                .map(cat => cat.split('/').map(s => s.trim()).join(', '))
                .join(', ')}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-3">Description</h2>
      <div
        className="mt-2 leading-relaxed text-gray-800 [&_ul]:list-disc [&_ul]:ml-6 [&_li]:mb-2"
        dangerouslySetInnerHTML={{ __html: book.description }}
      />
    <SignedIn><button className='shadow-lg w-44 h-12 rounded-lg transition transform hover:scale-103 duration-700' onClick={addToLibraryHandler}>{addedToLibrary ? 'Added to Library' : 'Add to Library'}
</button></SignedIn>

    </div>
  );
};

export default BookDetailsPage;
