import { useState, useEffect, useCallback, useRef } from 'react';
import { booksAPI } from '../lib/api';
import toast from 'react-hot-toast';

const DEBOUNCE_MS = 350;

/**
 * useBooks — server-side search, subject filter, and pagination.
 * Debounces the search input to avoid hammering the API.
 */
export function useBooks() {
  const [books,      setBooks]      = useState([]);
  const [subjects,   setSubjects]   = useState(['all']);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [subject,    setSubject]    = useState('all');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  const handleSetSearch = useCallback((val) => {
    setSearch(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1); // reset to page 1 on new search
    }, DEBOUNCE_MS);
  }, []);

  const handleSetSubject = useCallback((val) => {
    setSubject(val);
    setPage(1);
  }, []);

  // Load subjects once on mount
  useEffect(() => {
    booksAPI.subjects()
      .then(res => setSubjects(['all', ...res.data.subjects]))
      .catch(() => {});
  }, []);

  // Fetch books when search/subject/page changes
  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = { page };
    if (debouncedSearch)         params.search  = debouncedSearch;
    if (subject && subject !== 'all') params.subject = subject;

    booksAPI.list(params)
      .then(res => {
        setBooks(res.data.books);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Could not load books.';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, subject, page]);

  useEffect(() => { load(); }, [load]);

  return {
    books,
    subjects,
    loading,
    error,
    total,
    page,       setPage,
    totalPages,
    search,     setSearch: handleSetSearch,
    subject,    setSubject: handleSetSubject,
    reload:     load,
  };
}
