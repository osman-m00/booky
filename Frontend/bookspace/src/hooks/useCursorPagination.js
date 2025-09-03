import { useState, useCallback } from "react";

export default function useCursorPagination(fetchFunction) {
  const [books, setBooks] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [error, setError] = useState(null);

  // Load first page
  const loadInitial = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setCursor(null);
    setHasNext(true);

    try {
      const res = await fetchFunction(params);
      setBooks(res.data.data || []);
      setCursor(res.data.pagination?.nextCursor || null);
      setHasNext(res.data.pagination?.hasNext || false);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  // Load next page
  const loadMore = useCallback(async (params) => {
    if (!hasNext || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchFunction({ ...params, cursor });
      setBooks(prev => [...prev, ...(res.data.data || [])]);
      setCursor(res.data.pagination?.nextCursor || null);
      setHasNext(res.data.pagination?.hasNext || false);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, cursor, hasNext, loading]);

  return { books, loading, hasNext, loadInitial, loadMore, error };
}
