import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bookDetails } from '../../../api/books';
import { SignedIn, useAuth } from "@clerk/clerk-react";
import {
  addToLibrary as addToLibraryApi,
  checkBookInLibrary,
  removeFromLibrary
} from '../../../api/library';
import { Loader2 } from "lucide-react"; 
import AddToLibraryForm from './AddToLibraryForm';
import ReviewsSection from '../reviews/reviewsSection';

const BookDetailsPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [inLibrary, setInLibrary] = useState(false);
  const [checkingLibrary, setCheckingLibrary] = useState(true);
  const [updatingLibrary, setUpdatingLibrary] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { getToken, userId } = useAuth();

  const getBookDetails = async (id) => {
    try {
      const res = await bookDetails(id);
      setBook(res.data.book);
    } catch (error) {
      console.log('Failed to fetch book by id in Book Details page', error);
    }
  };

  const toggleLibraryHandler = async () => {
    if (!userId) return;
    setUpdatingLibrary(true);
    try {
      const token = await getToken();
      if (inLibrary) {
        const res = await removeFromLibrary({ bookId: id, token });
        if (res.status === 204) setInLibrary(false);
      } else {
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to update library:', error);
    } finally {
      setUpdatingLibrary(false);
    }
  };

  const checkLibrary = async (id) => {
    if (!userId) return;
    try {
      setCheckingLibrary(true);
      const token = await getToken();
      const res = await checkBookInLibrary({ bookId: id, token });
      if (res.status === 200) setInLibrary(true);
    } catch (error) {
      console.error('Failed to check book in library:', error);
    } finally {
      setCheckingLibrary(false);
    }
  };

  useEffect(() => {
    if (id) {
      getBookDetails(id);
      checkLibrary(id);
    }
  }, [id, userId, getToken]);

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
            <span className="block">
              Published:{' '}
              <span className="text-gray-700 font-medium">
                {book.publishedDate}
              </span>
            </span>
            <span className="block mt-1">{book.pageCount} pages</span>
          </div>

          <div className="mb-4">
            <p className="font-semibold text-sm text-gray-800 mb-1">Genres</p>
            <p className="text-sm text-gray-700">
              {Array.isArray(book.categories) && book.categories.length > 0
                ? book.categories
                    .map((cat) => cat.split('/').map((s) => s.trim()).join(', '))
                    .join(', ')
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-3">Description</h2>
      <div
        className="mt-2 leading-relaxed text-gray-800 [&_ul]:list-disc [&_ul]:ml-6 [&_li]:mb-2"
        dangerouslySetInnerHTML={{ __html: book.description }}
      />

      <SignedIn>
        <button
          className="shadow-lg w-52 h-12 rounded-lg transition transform hover:scale-103 duration-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          onClick={toggleLibraryHandler}
          disabled={checkingLibrary || updatingLibrary}
        >
          {checkingLibrary ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Checking...
            </>
          ) : updatingLibrary ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {inLibrary ? 'Removing...' : 'Adding...'}
            </>
          ) : inLibrary ? (
            'Remove from Library'
          ) : (
            'Add to Library'
          )}
        </button>
      </SignedIn>
      {showModal && 
      <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.5)] flex justify-center items-center" onClick={()=>setShowModal(false)}>
      <div onClick={(e)=>e.stopPropagation()}   className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"> 
      <AddToLibraryForm bookId = {id} 
        getToken = {getToken}
        onClose = {()=>setShowModal(false)}
        onSuccess = {()=> {setInLibrary(true); setShowModal(false);}}
      /> 
      </div>
      </div>
      }
     

     <ReviewsSection bookId = {id}/>

    </div>
  );
};

export default BookDetailsPage;
