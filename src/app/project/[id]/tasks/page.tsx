'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAccessToken } from '@/utils/auth';
import { setCurrentProjectId } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';
import { TASK_STATUSES, type TaskStatus } from '@/utils/tasks';
import TaskEmptyState, { TaskSearchEmptyState } from './components/TaskEmptyState';
import TaskErrorState from './components/TaskErrorState';
import TaskLoadingState from './components/TaskLoadingState';
import TasksBoard from './components/TasksBoard';
import TasksHeader, { TasksHeaderSkeleton } from './components/TasksHeader';
import TasksList from './components/TasksList';
import { EMPTY_TASKS_BY_STATUS } from './constants';
import type { PageState, Task, ViewMode } from './types';

export default function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [projectName, setProjectName] = useState('');
  const [tasksByStatus, setTasksByStatus] =
    useState<Record<TaskStatus, Task[]>>(EMPTY_TASKS_BY_STATUS);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTasks = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setPageState('loading');

    try {
      const results = await Promise.all(
        TASK_STATUSES.map(async (status) => {
          const url = supabaseRestUrl(`/project_tasks?project_id=eq.${id}&status=eq.${status}`);

          const response = await fetch(url, {
            method: 'GET',
            headers: supabaseAuthHeaders(token),
          });

          if (response.status === 401) {
            return { status, tasks: [] as Task[], unauthorized: true, ok: false };
          }

          if (!response.ok) {
            return { status, tasks: [] as Task[], unauthorized: false, ok: false };
          }

          const data: Task[] = await response.json();
          return { status, tasks: data, unauthorized: false, ok: true };
        })
      );

      if (results.some((result) => result.unauthorized)) {
        router.replace('/login');
        return;
      }

      if (!results.some((result) => result.ok)) {
        setPageState('error');
        return;
      }

      const nextTasksByStatus = { ...EMPTY_TASKS_BY_STATUS };
      results.forEach((result) => {
        nextTasksByStatus[result.status] = result.tasks;
      });

      setTasksByStatus(nextTasksByStatus);

      const totalTasks = results.reduce((count, result) => count + result.tasks.length, 0);
      setPageState(totalTasks === 0 ? 'empty' : 'success');
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

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredTasks = useMemo(() => {
    if (!normalizedSearch) return allTasks;

    return allTasks.filter((task) => {
      const taskId = (task.task_id ?? task.id).toLowerCase();
      return (
        task.title.toLowerCase().includes(normalizedSearch) || taskId.includes(normalizedSearch)
      );
    });
  }, [allTasks, normalizedSearch]);

  const filteredTasksByStatus = useMemo(() => {
    const next = { ...EMPTY_TASKS_BY_STATUS };

    TASK_STATUSES.forEach((status) => {
      next[status] = tasksByStatus[status].filter((task) =>
        filteredTasks.some((filteredTask) => filteredTask.id === task.id)
      );
    });

    return next;
  }, [filteredTasks, tasksByStatus]);

  const showSearchEmpty =
    pageState === 'success' && normalizedSearch.length > 0 && filteredTasks.length === 0;
  const showListContent = pageState === 'success' && !showSearchEmpty;
  const showBoardContent = pageState === 'success' && !showSearchEmpty && viewMode === 'board';

  return (
    <section className="flex min-h-screen flex-col gap-6">
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
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {pageState === 'error' && <TaskErrorState onRetry={fetchTasks} />}

          {pageState === 'empty' && <TaskEmptyState projectId={id} />}

          {showSearchEmpty && <TaskSearchEmptyState />}

          {showListContent && viewMode === 'list' && (
            <TasksList tasks={filteredTasks} totalCount={allTasks.length} />
          )}

          {showBoardContent && (
            <TasksBoard
              projectId={id}
              tasksByStatus={filteredTasksByStatus}
              className="hidden gap-6 overflow-x-auto pb-4 lg:flex"
            />
          )}

          {showBoardContent && (
            <TasksBoard
              projectId={id}
              tasksByStatus={filteredTasksByStatus}
              className="flex gap-4 overflow-x-auto pb-4 lg:hidden"
              columnKeyPrefix="mobile-"
            />
          )}
        </>
      )}
    </section>
  );
}
