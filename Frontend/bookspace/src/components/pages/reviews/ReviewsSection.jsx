import React, { useState, useEffect } from 'react';
import { listReviews } from '../../../api/reviews';
import { useAuth } from '@clerk/clerk-react';

const ReviewsSection = ({ bookId }) => {
  const [reviews, setReviews] = useState([]);
  const { getToken } = useAuth();

  // handle either a direct id or an object like { id: '...' }
  const effectiveBookId = bookId?.id || bookId;

  useEffect(() => {
    if (!effectiveBookId) {
      setReviews([]);
      return;
    }

    const fetchReviews = async () => {
      try {
        const token = await getToken();
        const res = await listReviews({ bookId: effectiveBookId, token });
        if (res?.status === 200) {

          // normalize: ensure each review has a single `user` object
          const normalized = (res.data.reviews || []).map((r) => ({
            ...r,
            user:
              // if backend returns users as array -> take first
              (Array.isArray(r.users) && r.users[0]) ||
              // if backend returns users as object -> use it
              (r.users && typeof r.users === 'object' ? r.users : null) ||
              // if backend already used `user` key
              r.user ||
              null,
          }));

          setReviews(normalized);
        } else {
          console.warn('Unexpected response when fetching reviews:', res);
          setReviews([]);
        }
      } catch (err) {
        console.error('Failed to fetch reviews for this book: ', err);
        setReviews([]);
      }
    };

    fetchReviews();
  }, [effectiveBookId, getToken]);

  const displayName = (user) =>
    user?.name || user?.full_name || user?.display_name || user?.email?.split?.('@')?.[0] || 'Anonymous';

  const avatarUrl = (user) => user?.avatar_url || user?.avatar || '';

  return (
    <div className="mt-10">
    <h1 className='text-2xl font-bold mb-5'>Reviews</h1>
      {reviews.length === 0 ? (
        <p>No reviews yet</p>
      ) : (
        reviews.map((review) => {
          const user = review.user;
          const name = displayName(user);

          return (
            <div key={review.id} className="flex  items-start mb-10 gap-4">
              {avatarUrl(user) ? (
                <img src={avatarUrl(user)} alt={name} className="w-16 h-16 rounded-lg  flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center bg-gray-200">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className='flex-1'>
                <p>
                  <strong>{name}</strong> rated: {review.rating}
                </p>
                <p>{review.content}</p>
                <p>{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ReviewsSection;
