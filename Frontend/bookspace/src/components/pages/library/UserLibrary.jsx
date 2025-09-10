import React, {useState, useEffect} from 'react'
import { ListLibrary } from '../../../api/library'
import { useAuth } from '@clerk/clerk-react'

const UserLibrary = () => {
    const tabs = ['All Books', 'Currently Reading', 'Want to Read', 'Finished']
    const [activeTab, setActiveTab] = useState('All Books')
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const {userId, getToken} = useAuth()

    const listlibrary = async () =>{
        if(!userId) return;
        try{
            const token = await getToken()
            const res = await ListLibrary({token})

            if(res.status===200) {setLoading(false); setBooks(res.data.items)
}
        }
    catch (error) {
            console.log('Failed to fetch library items', error)
        }
    }
    useEffect(()=>{
        listlibrary()
    }, [])
    console.log(books)
  return (
    <div className='p-10'>
        <h1 className='text-4xl  font-bold mb-10'>My Library</h1>
        <div className='flex flex-row justify-center gap-7'>
            {tabs.map((tab)=>
            (<button key={tab} onClick={()=>setActiveTab(tab)} className={`text-xl ${activeTab===tab ? "border-b-2 border-black font-semibold transition duration-900" : "text-gray-500"}`}> {tab} </button>)
            )}
        </div>
        <div className='mt-10'>
            {books.map(book=>(<div key={book.id}>
                {book.book.title}
            </div>))}
        </div>
    </div>
  )
}

export default UserLibrary