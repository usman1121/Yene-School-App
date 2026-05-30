import { useState, useCallback } from 'react';
import { unwrapData } from '@/lib/api/utils';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T) => void;
}

export function useApi<T = any>(
  apiFunc: (...args: any[]) => Promise<{ data: any }>,
  options?: { unwrap?: boolean }
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiFunc(...args);
      let result = options?.unwrap !== false ? unwrapData<T>(response, response?.data) : response?.data;
      if (result === undefined || result === null) result = response?.data;
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'An error occurred';
      setState((prev) => ({ ...prev, data: null, loading: false, error: message }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return { ...state, execute, reset, setData };
}
