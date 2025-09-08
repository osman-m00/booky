import api from './axios';


export const addToLibrary = ({ bookId, status = null, rating = null, notes = null, token }) => {
  return api.post(
    "/library/",
    { bookId, status, rating, notes },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
