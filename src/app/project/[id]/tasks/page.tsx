'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { getAccessToken } from '@/utils/auth';
import { setCurrentProjectId } from '@/utils/project';
import {
  getPageNumbers,
  getTotalPages,
  parseContentRange,
  TASKS_PAGE_SIZE,
} from '@/utils/pagination';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';
import type { TaskStatus } from '@/utils/tasks';
import TaskEmptyState from './components/TaskEmptyState';
import TaskErrorState from './components/TaskErrorState';
import TaskLoadingState from './components/TaskLoadingState';
import TasksBoard from './components/TasksBoard';
import TasksHeader, { TasksHeaderSkeleton } from './components/TasksHeader';
import TasksList from './components/TasksList';
import { mergeTasksById } from './helpers';
import { BOARD_SCROLL_CONTAINER_CLASS } from './constants';
import type { PageState, Task, ViewMode } from './types';

const MOBILE_QUERY = '(max-width: 767px)';

function parseViewMode(value: string | null): ViewMode {
  return value === 'list' ? 'list' : 'board';
}

export default function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode = parseViewMode(searchParams.get('view'));

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const lastProjectIdRef = useRef(id);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [projectName, setProjectName] = useState('');
  const [listTasks, setListTasks] = useState<Task[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [boardRefreshKey, setBoardRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const totalPages = getTotalPages(totalCount, TASKS_PAGE_SIZE);
  const hasMoreMobile = listTasks.length < totalCount;
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, _currentStatus: TaskStatus, newStatus: TaskStatus) => {
      const token = getAccessToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const url = supabaseRestUrl(`/tasks?id=eq.${taskId}`);
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            ...supabaseAuthHeaders(token),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('PATCH failed');
        }

        setBoardRefreshKey((key) => key + 1);
        showToast('Task status updated', 'success');
      } catch {
        showToast('Failed to update task status', 'error');
      }
    },
    [router, showToast]
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      if (mode === 'list') {
        setCurrentPage(1);
        setListTasks([]);
      }

      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set('view', mode);
      router.push(`${pathname}?${nextSearchParams.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const fetchListTasks = useCallback(
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
        setPageState('loading');
      }

      try {
        const url = supabaseRestUrl(
          `/project_tasks?project_id=eq.${id}&limit=${TASKS_PAGE_SIZE}&offset=${offset}`
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
          setPageState('error');
          return;
        }

        const { start, end, total } = parseContentRange(response.headers.get('content-range'));
        const data: Task[] = await response.json();

        setTotalCount(total);
        setRangeStart(start);
        setRangeEnd(end);
        setListTasks((prev) => (append ? mergeTasksById(prev, data) : data));
        setPageState(total === 0 ? 'empty' : 'success');
      } catch {
        setPageState('error');
      } finally {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    },
    [id, router]
  );

  const fetchBoardEmptyCheck = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setPageState('loading');

    try {
      const url = supabaseRestUrl(`/project_tasks?project_id=eq.${id}&limit=0&offset=0`);

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
        setPageState('error');
        return;
      }

      const { total } = parseContentRange(response.headers.get('content-range'));
      setPageState(total === 0 ? 'empty' : 'success');
    } catch {
      setPageState('error');
    }
  }, [id, router]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setCurrentProjectId(id);

    const fetchProjectName = async () => {
      try {
        const response = await fetch(supabaseRestUrl(`/projects?id=eq.${id}&select=name`), {
          method: 'GET',
          headers: supabaseAuthHeaders(token),
        });

        if (response.ok) {
          const data: { name: string }[] = await response.json();
          setProjectName(data[0]?.name ?? '');
        }
      } catch {
        // Project name is optional for the breadcrumb fallback
      }
    };

    fetchProjectName();
  }, [id, router]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const updateIsMobile = () => {
      const matches = mediaQuery.matches;
      setIsMobile((wasMobile) => {
        if (matches !== wasMobile) {
          setCurrentPage(1);
          setListTasks([]);
        }
        return matches;
      });
    };

    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);
    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  useEffect(() => {
    if (viewMode === 'board') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- board empty check on view mount
      fetchBoardEmptyCheck();
      return;
    }

    if (lastProjectIdRef.current !== id) {
      lastProjectIdRef.current = id;
      setCurrentPage(1);
      setListTasks([]);
      fetchListTasks({ offset: 0, append: false });
      return;
    }

    if (isMobile) {
      fetchListTasks({ offset: 0, append: false });
      return;
    }

    fetchListTasks({
      offset: (currentPage - 1) * TASKS_PAGE_SIZE,
      append: false,
    });
  }, [viewMode, currentPage, isMobile, id, fetchListTasks, fetchBoardEmptyCheck]);

  useEffect(() => {
    if (viewMode !== 'list' || !isMobile || pageState !== 'success' || !hasMoreMobile) return;

    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMoreRef.current) {
          fetchListTasks({ offset: listTasks.length, append: true });
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, isMobile, pageState, hasMoreMobile, listTasks.length, fetchListTasks]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return;
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentPage, totalPages]
  );

  const handleRetry = useCallback(() => {
    if (viewMode === 'board') {
      fetchBoardEmptyCheck();
      return;
    }

    if (isMobile) {
      fetchListTasks({ offset: 0, append: false });
      return;
    }

    fetchListTasks({
      offset: (currentPage - 1) * TASKS_PAGE_SIZE,
      append: false,
    });
  }, [viewMode, isMobile, currentPage, fetchBoardEmptyCheck, fetchListTasks]);

  const breadcrumbProjectName = (projectName || 'Project').toUpperCase();

  const showListContent = pageState === 'success' && viewMode === 'list';
  const showBoardContent = pageState === 'success' && viewMode === 'board';

  return (
    <section className="flex min-w-0 w-full max-w-full flex-col gap-6">
      {toast && (
        <div
          role="status"
          className={`fixed top-20 right-4 left-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-sm border bg-white px-4 py-3 shadow-[0_1px_2px_0px_#0000000d] sm:right-6 sm:left-auto ${
            toast.type === 'success' ? 'border-[#82F9BE]/40' : 'border-[#FFDBD6]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-[#003D9B]" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-[#BA1A1A]" />
          )}
          <p className="flex-1 text-sm font-semibold text-[#041B3C]">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="rounded-sm p-1 text-[#434654] transition-colors hover:bg-[#F1F3FF]"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <ProjectBreadcrumb
        items={[
          { label: 'Projects', href: '/project' },
          { label: breadcrumbProjectName },
          { label: 'Tasks', active: true },
        ]}
      />

      {pageState === 'loading' ? (
        <>
          <TasksHeaderSkeleton />
          <TaskLoadingState viewMode={viewMode} />
        </>
      ) : (
        <>
          <TasksHeader
            projectName={projectName}
            projectId={id}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />

          {pageState === 'error' && <TaskErrorState onRetry={handleRetry} />}

          {pageState === 'empty' && <TaskEmptyState projectId={id} />}

          {showListContent && (
            <TasksList
              projectId={id}
              tasks={listTasks}
              totalCount={totalCount}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              isMobile={isMobile}
              currentPage={currentPage}
              totalPages={totalPages}
              pageNumbers={pageNumbers}
              isLoadingMore={isLoadingMore}
              hasMoreMobile={hasMoreMobile}
              loadMoreRef={loadMoreRef}
              onPageChange={handlePageChange}
            />
          )}

          {showBoardContent && (
            <div className={BOARD_SCROLL_CONTAINER_CLASS}>
              <TasksBoard
                projectId={id}
                refreshKey={boardRefreshKey}
                onTaskStatusChange={handleTaskStatusChange}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
