import React, {useState, useEffect, act} from 'react'

const UserLibrary = () => {
    const tabs = ['All Books', 'Currently Reading', 'Want to Read', 'Finished']
    const [activeTab, setActiveTab] = useState('All Books')

  return (
    <div className='p-10'>
        <h1 className='text-4xl  font-bold mb-10'>My Library</h1>
        <div className='flex flex-row justify-center gap-7'>
            {tabs.map((tab)=>
            (<button key={tab} onClick={()=>setActiveTab(tab)} className={`text-xl ${activeTab===tab ? "border-b-2 border-black font-semibold transition duration-900" : "text-gray-500"}`}> {tab} </button>)
            )}
        </div>
        <div className='mt-10'>
            <p>Currently Selected: {activeTab}</p>
        </div>
    </div>
  )
}

export default UserLibrary