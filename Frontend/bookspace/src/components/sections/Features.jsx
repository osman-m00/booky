import React from 'react'

const Features = () => {
  return (
    <section>
        <h2 className='text-center text-3xl font-bold mb-8'>Features</h2>
        <div className='grid grid-flow-col justify-center gap-8'>
        <div className='flex flex-col shadow-lg items-center w-60 h-64 p-4 rounded-lg'>
        <div className='w-10 h-10 bg-gray-950 mb-4'></div>
        <h2 className='text-2xl text-center mb-2'>Discover new books</h2>
        <p className='text-xl text-center'>Find your next favorite book</p>
        </div>
        <div className='flex flex-col shadow-lg items-center w-60 h-64 p-4 rounded-lg'>
        <div className='border border-y-gray-800 w-10 h-10 bg-gray-950 mb-4'></div>
        <h2 className='text-2xl text-center'>Join groups and discussions</h2>
        <p className='text-xl text-center'>Connect with like minded readers</p>
        </div>
        <div className='flex flex-col shadow-lg items-center w-60 h-64 p-4 rounded-lg'>
        <div className='border border-y-gray-800 w-10 h-10 bg-gray-950 mb-4'></div>
        <h2 className='text-2xl text-center'>Track your reading library</h2>
        <p className='text-xl text-center'>Keep track of what you need</p>
        </div>
        
        </div>
    </section>
  )
}

export default Features