import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export function usePagination(options?: UsePaginationOptions) {
  const [page, setPage] = useState(options?.initialPage ?? 1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = options?.pageSize ?? 20;

  const nextPage = useCallback(() => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [hasMore, loadingMore]);

  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setLoadingMore(false);
  }, []);

  const onLoadMoreComplete = useCallback((returnedCount: number) => {
    setLoadingMore(false);
    if (returnedCount < pageSize) {
      setHasMore(false);
    }
  }, [pageSize]);

  return { page, hasMore, loadingMore, pageSize, nextPage, reset, onLoadMoreComplete };
}
