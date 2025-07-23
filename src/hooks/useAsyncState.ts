import { useState, useCallback } from 'react';

interface UseAsyncStateReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  execute: <R>(asyncFn: () => Promise<R>) => Promise<R | null>;
}

/**
 * Custom hook to handle common async state patterns (loading, error, data)
 * Consolidates the repeated useState pattern across components
 */
export const useAsyncState = <T = any>(initialData: T | null = null): UseAsyncStateReturn<T> => {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  const execute = useCallback(async <R>(asyncFn: () => Promise<R>): Promise<R | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      setData(result as any); // Safe cast since this is generic
      return result;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    setData,
    setLoading,
    setError,
    reset,
    execute,
  };
}; 