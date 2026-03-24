import { useState, useCallback, useRef } from 'react';
import { searchVideos } from '../services/bilibili';
import type { SearchVideoOrder } from '../utils/searchVideosParams';
import type { VideoItem } from '../services/types';

export function useSearch() {
  const [keyword, setKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<SearchVideoOrder>('totalrank');
  const [results, setResults] = useState<VideoItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const search = useCallback(async (kw: string, reset = false, order?: SearchVideoOrder) => {
    if (!kw.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const currentPage = reset ? 1 : page;
    const effectiveOrder = order ?? sortOrder;
    try {
      const items = await searchVideos(kw, currentPage, effectiveOrder);
      if (effectiveOrder !== sortOrder) {
        setSortOrder(effectiveOrder);
      }
      if (reset) {
        setResults(items);
        setPage(2);
      } else {
        setResults(prev => [...prev, ...items]);
        setPage(p => p + 1);
      }
      setHasMore(items.length >= 20);
    } catch {
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, sortOrder]);

  const loadMore = useCallback(() => {
    if (!keyword.trim() || loadingRef.current || !hasMore) return;
    search(keyword, false);
  }, [keyword, hasMore, search]);

  return { keyword, setKeyword, sortOrder, setSortOrder, results, loading, hasMore, search, loadMore };
}
