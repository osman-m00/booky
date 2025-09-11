import React, {useState, useEffect, useRef} from 'react'
import { ListLibrary } from '../../../api/library'
import { useAuth } from '@clerk/clerk-react'
import LibraryCard from './LibraryCard'
const UserLibrary = () => {
    const tabs = ['All Books', 'Currently Reading', 'Want to Read', 'Finished']
    const [activeTab, setActiveTab] = useState('All Books')
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const {userId, getToken} = useAuth()
    const [filteredBooks, setFilteredBooks] = useState([]);
    const listlibrary = async () =>{
        if(!userId) return;
        try{
            const token = await getToken()
            const res = await ListLibrary({token})

            if(res.status===200) { const normalizedBooks = res.data.items.map(book => ({ ...book, status: book.book.status || "All Books", }));
            setBooks(normalizedBooks);
             setLoading(false);
}
        }
    catch (error) {
            console.log('Failed to fetch library items', error)
        }
    }
   
    useEffect(()=>{
        listlibrary()
    }, [])
      useEffect(()=>{
        setFilteredBooks(activeTab==='All Books' ? books : books.filter(book=>book.book.status === activeTab))
    }, [activeTab, books])
    console.log(books)
  return (
    <div className='p-10'>
        <h1 className='text-4xl  font-bold mb-10'>My Library</h1>
        <div className='flex flex-row justify-center gap-7'>
            {tabs.map((tab)=>
            (<button key={tab} onClick={()=>setActiveTab(tab)} className={`text-xl ${activeTab===tab ? "border-b-2 border-black font-semibold transition duration-900" : "text-gray-500"}`}> {tab} </button>)
            )}
        </div>
        <div className='mt-10 grid grid-cols-4'>
            {filteredBooks.map(book=>(
             <LibraryCard
                key={book.id}
                title={book.book.title}
                author={book.book.author}
                 imgUrl = {book.book.cover_image_url}

             />
             ))}
        </div>
    </div>
  )
}

export default UserLibrary