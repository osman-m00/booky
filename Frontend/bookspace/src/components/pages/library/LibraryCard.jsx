import React, {useState, useEffect} from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Loader2 } from "lucide-react"; // spinner icon
import LibraryDetailsCard from './LibraryDetailsCard';

const LibraryCard = ({book, onRemove }) => {
  const {userId, getToken} = useAuth();
  const [detailsToggle, setdetailsToggle] = useState(false)

  
 
  return (
    <div className="shadow-lg w-60 h-80 rounded-lg p-4 flex flex-col justify-between">
     
      <h1 className="font-bold text-lg text-center line-clamp-1">
        {book.book.title}
      </h1>

     
      <div className="flex justify-center ">
        <img
          src={book.book.cover_image_url}
          alt={book.book.title}
          className="h-32 w-full object-cover rounded-md"
        />
      </div>

      
      <div className="flex flex-col items-center gap-1">
        <span className="text-gray-700 text-sm line-clamp-1">{book.book.author}</span>
      </div>

     
      <div className="flex justify-center mt-4">
      <button className="shadow-lg rounded-lg w-24 h-10 mb-2 transition transform duration-300 hover:scale-105" onClick={()=>setdetailsToggle(true)}>
          Details
        </button>
      </div>
      {detailsToggle && 
      <div className='fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.5)] flex justify-center items-center' onClick={()=>setdetailsToggle(false)}>
      <div onClick={(e)=>e.stopPropagation()} className='bg-white p-6 rounded-lg shadow-lg max-w-md w-full'>
      <LibraryDetailsCard book={book} getToken = {getToken} userId = {userId} onRemove={onRemove}/>
      </div>
      </div>
      }
    </div>
  )
}

export default LibraryCard
