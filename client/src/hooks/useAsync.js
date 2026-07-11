import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export const useAsync = (fn, deps = [], options = {}) => {
  const [data, setData] = useState(options.initialData ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fn(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      if (options.toast !== false) toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute().catch(() => {});
  }, [execute]);

  return { data, loading, error, refresh: execute, setData };
};
