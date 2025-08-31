import React from 'react'

const HeroSection = () => {
  return (
    <section className='text-center py-14'>
        <h1 className='text-4xl font-bold'>Welcome to Bookspace</h1>
        <p className='mt-4 text-lg'>Discover, Review and Share Your Favorite Books</p>
        <div className='mt-4 space-x-8'>
            <button className='w-40 border border-gray-400 rounded-lg px-4 py-2 font-bold
            transform transition duration-800 ease-in-out hover:scale-105 cursor-pointer'>Browse Books</button>
            <button className='w-40 border border-gray-400 rounded-lg px-4 py-2 font-bold
            transform transition duration-800 ease-in-out hover:scale-105 cursor-pointer'>Join Now</button>
        </div>
    </section>
  )
}

export default HeroSection