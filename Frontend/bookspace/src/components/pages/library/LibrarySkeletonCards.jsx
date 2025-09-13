import React from 'react';

const LibraryCardSkeleton = () => {
  return (
    <div className="shadow-lg w-60 h-80 rounded-lg p-4 flex flex-col justify-between animate-pulse">
      {/* Title Skeleton */}
      <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>

      {/* Image Skeleton */}
      <div className="flex justify-center mb-2">
        <div className="h-32 w-full bg-gray-300 rounded-md"></div>
      </div>

      {/* Author Skeleton */}
      <div className="flex flex-col items-center gap-1 mb-2">
        <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
      </div>

      {/* Button Skeleton */}
      <div className="flex justify-center mt-4">
        <div className="h-10 w-24 bg-gray-300 rounded-lg"></div>
      </div>
    </div>
  );
};

export default LibraryCardSkeleton;
