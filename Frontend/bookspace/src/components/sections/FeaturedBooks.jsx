import React from 'react'

const FeaturedBooks = () => {
  return (
    <section className="py-16">
      <h2 className="text-center text-3xl font-bold mb-8">
        Find Books based on your preferences
      </h2>
      
      <div className="grid grid-cols-2 gap-16 items-start">
        
        {/* Left Column */}
        <div className="flex flex-col">
          <p className="mb-4 text-lg font-medium text-center">
            Because Adam liked these:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-65 ml-40 justify-items-center">
            {[1, 2, 3].map((book) => (
              <div
                key={book}
                className="flex flex-col items-center border border-gray-500 rounded-lg p-4 transform transition duration-200 hover:scale-105 w-60"
              >
                <div className="w-24 h-36 bg-gray-300 rounded mb-2"></div>
                <p className="font-semibold text-center">Book Title</p>
                <p className="text-sm text-gray-500 text-center">Book Author</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col items-center">
          <p className="mb-4 text-lg font-medium text-center">
            He got recommended this: 
          </p>
          <div className="flex flex-col items-center border border-gray-500 rounded-lg p-4 transform transition duration-200 hover:scale-105 w-60">
            <div className="w-24 h-36 bg-gray-300 rounded mb-2"></div>
            <p className="font-semibold text-center">Book Title</p>
            <p className="text-sm text-gray-500 text-center">Book Author</p>
          </div>
        </div>

      </div>
    </section>
  )
}

export default FeaturedBooks
