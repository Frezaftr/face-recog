'use client';

import { useState, useCallback } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'sonner';
import * as searchApi from '@/lib/api/search';
import { extractErrorMessage } from '@/lib/api/client';
import type { SearchResponse } from '@/lib/types';


export function useSearch() {
  const [queryProgress, setQueryProgress] = useState(0);
  const [results, setResults] = useState<SearchResponse | null>(null);

  const mutation = useMutation(
    ({ file, topK }: { file: File; topK: number }) =>
      searchApi.searchByFace(file, topK, setQueryProgress),
    {
      onSuccess: (data: SearchResponse) => {
        setResults(data);
        setQueryProgress(0);
        if (data.results.length === 0) {
          toast.info('No matching faces found');
        } else {
          toast.success(`Found ${data.results.length} match${data.results.length > 1 ? 'es' : ''} in ${data.latencyMs}ms`);
        }
      },
      onError: (error: unknown) => {
        toast.error(extractErrorMessage(error));
        setQueryProgress(0);
      },
    },
  );

  const search = useCallback(
    (file: File, topK = 10) => mutation.mutateAsync({ file, topK }),
    [mutation],
  );

  const clearResults = useCallback(() => setResults(null), []);

  return {
    search,
    results,
    clearResults,
    isSearching: mutation.isLoading,
    queryProgress,
  };
}
