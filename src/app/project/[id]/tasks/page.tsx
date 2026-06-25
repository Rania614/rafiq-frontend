'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAccessToken } from '@/utils/auth';
import { setCurrentProjectId } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';
import { TASK_STATUSES } from '@/utils/tasks';
import TaskDetailsModal from './components/TaskDetailsModal';
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleOpenTaskDetails = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  const handleCloseTaskDetails = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

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
            <TasksList
              projectId={id}
              tasks={allTasks}
              totalCount={allTasks.length}
              onOpenTaskDetails={handleOpenTaskDetails}
            />
          )}

          {showBoardContent && (
            <div className={BOARD_SCROLL_CONTAINER_CLASS}>
              <TasksBoard
                projectId={id}
                tasksByStatus={tasksByStatus}
                onOpenTaskDetails={handleOpenTaskDetails}
              />
            </div>
          )}
        </>
      )}

      {selectedTaskId && (
        <TaskDetailsModal taskId={selectedTaskId} projectId={id} onClose={handleCloseTaskDetails} />
      )}
    </section>
  );
}
