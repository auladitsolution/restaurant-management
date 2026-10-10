"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchData, isDemoMode, FetchDataOptions } from "./apiClient";

export interface UseConditionalDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isDemo: boolean;
}

/**
 * Custom React hook for fetching data conditionally based on NEXT_PUBLIC_DEMO_MODE.
 *
 * @param url The API route endpoint (e.g. '/api/reports?range=today')
 * @param options Additional request options or inline mock data overrides
 *
 * @example
 * const { data: reports, loading, error, refetch } = useConditionalData('/api/reports?range=today');
 */
export function useConditionalData<T = any>(
  url: string,
  options?: FetchDataOptions<T>
): UseConditionalDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isDemo = isDemoMode();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData<T>(url, options);
      setData(result);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch: loadData,
    isDemo,
  };
}
