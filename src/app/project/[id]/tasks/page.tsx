'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { getAccessToken } from '@/utils/auth';
import { setCurrentProjectId } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';
import { TASK_STATUSES, type TaskStatus } from '@/utils/tasks';
import TaskEmptyState from './components/TaskEmptyState';
import TaskErrorState from './components/TaskErrorState';
import TaskLoadingState from './components/TaskLoadingState';
import TasksBoard from './components/TasksBoard';
import TasksHeader, { TasksHeaderSkeleton } from './components/TasksHeader';
import TasksList from './components/TasksList';
import { countTasks, groupTasksByStatus } from './helpers';
import { BOARD_SCROLL_CONTAINER_CLASS } from './constants';
import type { PageState, Task, ViewMode } from './types';

function parseViewMode(value: string | null): ViewMode {
  return value === 'list' ? 'list' : 'board';
}

export default function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode = parseViewMode(searchParams.get('view'));

  const [pageState, setPageState] = useState<PageState>('loading');
  const [projectName, setProjectName] = useState('');
  const [tasksByStatus, setTasksByStatus] = useState(() => groupTasksByStatus([]));
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, currentStatus: TaskStatus, newStatus: TaskStatus) => {
      // 1. Optimistic Update: remove from source status list and append to target status list exactly once
      setTasksByStatus((prev) => {
        const currentList = prev[currentStatus] || [];
        const task = currentList.find((t) => t.id === taskId);
        if (!task) return prev;

        const updatedTask = { ...task, status: newStatus };
        const nextCurrentList = currentList.filter((t) => t.id !== taskId);
        const nextNewList = (prev[newStatus] || []).filter((t) => t.id !== taskId);
        nextNewList.push(updatedTask);

        return {
          ...prev,
          [currentStatus]: nextCurrentList,
          [newStatus]: nextNewList,
        };
      });

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

        setToast({ message: 'Task status updated', type: 'success' });
      } catch {
        // 2. Rollback on failure: revert both columns
        setTasksByStatus((prev) => {
          const newList = prev[newStatus] || [];
          const task = newList.find((t) => t.id === taskId);
          if (!task) return prev;

          const revertedTask = { ...task, status: currentStatus };
          const nextNewList = newList.filter((t) => t.id !== taskId);
          const nextCurrentList = (prev[currentStatus] || []).filter((t) => t.id !== taskId);
          nextCurrentList.push(revertedTask);

          return {
            ...prev,
            [newStatus]: nextNewList,
            [currentStatus]: nextCurrentList,
          };
        });

        setToast({ message: 'Failed to update task status', type: 'error' });
      }
    },
    [router]
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.set('view', mode);
      router.push(`${pathname}?${nextSearchParams.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const fetchTasks = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setPageState('loading');

    try {
      const url = supabaseRestUrl(`/project_tasks?project_id=eq.${id}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: supabaseAuthHeaders(token),
      });

      if (response.status === 401) {
        router.replace('/login');
        return;
      }

      if (!response.ok) {
        setPageState('error');
        return;
      }

      const data: Task[] = await response.json();
      const groupedTasks = groupTasksByStatus(data);

      setTasksByStatus(groupedTasks);
      setPageState(countTasks(groupedTasks) === 0 ? 'empty' : 'success');
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
    // Data load intentionally triggered from effect; fetchTasks updates local UI state.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preserve existing tasks fetch flow
    fetchTasks();
  }, [id, router, fetchTasks]);

  const breadcrumbProjectName = (projectName || 'Project').toUpperCase();

  const allTasks = useMemo(
    () => TASK_STATUSES.flatMap((status) => tasksByStatus[status]),
    [tasksByStatus]
  );

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

          {pageState === 'error' && <TaskErrorState onRetry={fetchTasks} />}

          {pageState === 'empty' && <TaskEmptyState projectId={id} />}

          {showListContent && (
            <TasksList projectId={id} tasks={allTasks} totalCount={allTasks.length} />
          )}

          {showBoardContent && (
            <div className={BOARD_SCROLL_CONTAINER_CLASS}>
              <TasksBoard
                projectId={id}
                tasksByStatus={tasksByStatus}
                onTaskStatusChange={handleTaskStatusChange}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
