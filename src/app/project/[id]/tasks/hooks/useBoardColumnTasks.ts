'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/utils/auth';
import { BOARD_COLUMN_PAGE_SIZE, parseContentRange } from '@/utils/pagination';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';
import type { TaskStatus } from '@/utils/tasks';
import { mergeTasksById } from '../helpers';
import type { Task } from '../types';

export function useBoardColumnTasks(projectId: string, status: TaskStatus) {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const hasMore = tasks.length < totalCount;

  const fetchColumnTasks = useCallback(
    async ({ offset, append = false }: { offset: number; append?: boolean }) => {
      const token = getAccessToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      if (append) {
        if (isLoadingMoreRef.current) return;
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(false);
        setTasks([]);
        setTotalCount(0);
      }

      try {
        const url = supabaseRestUrl(
          `/project_tasks?project_id=eq.${projectId}&status=eq.${status}&limit=${BOARD_COLUMN_PAGE_SIZE}&offset=${offset}`
        );

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            ...supabaseAuthHeaders(token),
            Prefer: 'count=exact',
          },
        });

        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        if (!response.ok) {
          setError(true);
          return;
        }

        const { total } = parseContentRange(response.headers.get('content-range'));
        const data: Task[] = await response.json();

        setTotalCount(total);
        setTasks((prev) => (append ? mergeTasksById(prev, data) : data));
      } catch {
        setError(true);
      } finally {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
        setIsLoading(false);
      }
    },
    [projectId, router, status]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- column initial fetch
    fetchColumnTasks({ offset: 0, append: false });
  }, [projectId, status, fetchColumnTasks]);

  useEffect(() => {
    if (isLoading || !hasMore) return;

    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMoreRef.current) {
          fetchColumnTasks({ offset: tasks.length, append: true });
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchColumnTasks, hasMore, isLoading, tasks.length]);

  const retry = useCallback(() => {
    fetchColumnTasks({ offset: 0, append: false });
  }, [fetchColumnTasks]);

  return {
    tasks,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMoreRef,
    retry,
  };
}
