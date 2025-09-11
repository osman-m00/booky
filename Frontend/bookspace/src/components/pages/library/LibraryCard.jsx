import React from 'react'

const LibraryCard = ({ title, author, imgUrl }) => {
  return (
    <div className="shadow-lg w-60 h-80 rounded-lg p-4 flex flex-col justify-between">
      {/* Title */}
      <h1 className="font-bold text-lg text-center line-clamp-1">
        {title}
      </h1>

      {/* Image */}
      <div className="flex justify-center ">
        <img
          src={imgUrl}
          alt={title}
          className="h-32 w-full object-cover rounded-md"
        />
      </div>

      {/* Author */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-gray-700 text-sm line-clamp-1">{author}</span>
      </div>

      {/* Button */}
      <div className="flex justify-center mt-4">
        <button className="shadow-lg rounded-lg w-24 h-10 mb-2 transition transform duration-300 hover:scale-105">
          Details
        </button>
      </div>
    </div>
  )
}

export default LibraryCard
