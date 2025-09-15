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

export const checkBookInLibrary = ({ bookId, token }) => {
  return api.get(
    `/library/${bookId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const removeFromLibrary = ({ bookId, token }) => {
  return api.delete(`/library/${bookId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const ListLibrary = ({token}) => {
  return api.get(
    `/library/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};


export const updateLibraryItem = ({ bookId, status = null, rating = null, notes = null, token }) => {
  return api.put(
    `/library/${bookId}`,
    {status, rating, notes },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};