import React, {useState, useEffect} from 'react'
import { removeFromLibrary } from '../../../api/library'
import { useAuth } from '@clerk/clerk-react'
import { Loader2 } from "lucide-react"; // spinner icon

const LibraryCard = ({id, title, author, imgUrl, onRemove }) => {
  const {userId, getToken} = useAuth();
  const [loading, setLoading] = useState(false);

  const removeFunction = async () =>{
    setLoading(true);
    try{    
      
      const token = await getToken();
      if(!userId || !token){
        return
      }
      const res = await removeFromLibrary({bookId: id, token})
      if(res.status === 204) {onRemove(id); }
        }catch(error){
          console.log('Failed to remove book from library, error: ', error);
        }
  }

 
  return (
    <div className="shadow-lg w-60 h-80 rounded-lg p-4 flex flex-col justify-between">
     
      <h1 className="font-bold text-lg text-center line-clamp-1">
        {title}
      </h1>

     
      <div className="flex justify-center ">
        <img
          src={imgUrl}
          alt={title}
          className="h-32 w-full object-cover rounded-md"
        />
      </div>

      
      <div className="flex flex-col items-center gap-1">
        <span className="text-gray-700 text-sm line-clamp-1">{author}</span>
      </div>

     
      <div className="flex justify-center mt-4">
     { loading ? (<Loader2 className='w-5 h-5 animate-spin'/>) : (<button className="shadow-lg rounded-lg w-24 h-10 mb-2 transition transform duration-300 hover:scale-105" onClick={removeFunction}>
          Remove from library
        </button>)}
      </div>
    </div>
  )
}

export default LibraryCard
