'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LayoutGrid, Loader2, Plus, Search, SlidersHorizontal } from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAvatarLetters } from '@/utils/avatar';
import { getAccessToken } from '@/utils/auth';
import { getProjectTasksNewHref, setCurrentProjectId } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';
import {
  formatTaskCardDate,
  STATUS_DOT_COLORS,
  supabaseEqValue,
  TASK_STATUSES,
  type TaskStatus,
} from '@/utils/tasks';

interface TaskUser {
  name?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  deadline?: string | null;
  assignee?: TaskUser | null;
}

function TaskCard({ task, status }: { task: Task; status: TaskStatus }) {
  const isBlocked = status === 'BLOCKED';
  const isInProgress = status === 'IN PROGRESS';
  const dateLabel = formatTaskCardDate(task.deadline);
  const assigneeName = task.assignee?.name ?? '';

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        isBlocked
          ? 'border-red-200 bg-red-50/60'
          : isInProgress
            ? 'border-[#CBD5E1] border-l-4 border-l-[#0046AD]'
            : 'border-[#CBD5E1]'
      }`}
    >
      <p className="text-sm font-semibold leading-snug text-[#0A192F]">{task.title}</p>

      {isBlocked && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-wider text-[#D31818] uppercase">
          <AlertTriangle size={12} className="shrink-0" />
          Delayed
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        {dateLabel ? (
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              dateLabel === 'TODAY' ? 'text-[#0046AD]' : 'text-[#4A5568]'
            }`}
          >
            {dateLabel}
          </span>
        ) : (
          <span />
        )}

        {assigneeName ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E2ECFF] text-[9px] font-bold text-[#0046AD]">
            {getAvatarLetters(assigneeName)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TaskColumn({ projectId, status }: { projectId: string; status: TaskStatus }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const url = supabaseRestUrl(
          `/project_tasks?project_id=eq.${projectId}&status=eq.${supabaseEqValue(status)}`
        );

        const response = await fetch(url, {
          method: 'GET',
          headers: supabaseAuthHeaders(token),
        });

        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        if (response.ok) {
          const data: Task[] = await response.json();
          setTasks(data);
        }
      } catch {
        // Keep column empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId, status, router]);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_COLORS[status]}`} />
        <h2 className="flex-1 text-[11px] font-bold tracking-wider text-[#0A192F] uppercase">
          {status}
        </h2>
        <span className="rounded-md bg-[#E2ECFF] px-1.5 py-0.5 text-[10px] font-bold text-[#0046AD]">
          {loading ? '…' : tasks.length}
        </span>
        <Link
          href={getProjectTasksNewHref(projectId, status)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#4A5568] transition-colors hover:bg-[#E2ECFF] hover:text-[#0046AD]"
          aria-label={`Add task to ${status}`}
        >
          <Plus size={16} />
        </Link>
      </div>

      <Link
        href={getProjectTasksNewHref(projectId, status)}
        className="mb-3 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F4F7FF]/40 px-3 py-3 text-[10px] font-bold tracking-wider text-[#4A5568] uppercase transition-colors hover:border-[#0046AD]/40 hover:bg-[#E2ECFF]/60 hover:text-[#0046AD]"
      >
        <Plus size={14} />
        Add New Task
      </Link>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[#0046AD]" />
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} status={status} />)
        )}
      </div>
    </div>
  );
}

export default function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [projectName, setProjectName] = useState('');

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

  const breadcrumbProjectName = (projectName || 'Project').toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <ProjectBreadcrumb
        items={[
          { label: 'Projects', href: '/project' },
          { label: breadcrumbProjectName },
          { label: 'Tasks', active: true },
        ]}
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">
            Active Workboard
          </h1>
          <p className="mt-1 text-sm text-[#4A5568]">
            Curating {projectName || 'this project'}&apos;s production pipeline and milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:flex-none sm:w-56">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#0046AD]/60"
            />
            <input
              type="search"
              placeholder="Search tasks..."
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F4F7FF]/60 py-2.5 pr-4 pl-9 text-sm text-[#0A192F] placeholder:text-[#4A5568]/60 focus:border-[#0046AD] focus:outline-none focus:ring-1 focus:ring-[#0046AD]"
            />
          </div>

          <div className="relative">
            <LayoutGrid
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#0046AD]"
            />
            <select
              defaultValue="board"
              className="appearance-none rounded-xl border border-[#CBD5E1] bg-white py-2.5 pr-8 pl-9 text-sm font-semibold text-[#0A192F] focus:border-[#0046AD] focus:outline-none focus:ring-1 focus:ring-[#0046AD]"
            >
              <option value="list">List View</option>
              <option value="board">Board View</option>
            </select>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#CBD5E1] text-[#4A5568] transition-colors hover:bg-[#F4F7FF] hover:text-[#0046AD]"
            aria-label="Filter tasks"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4">
          {TASK_STATUSES.map((status) => (
            <TaskColumn key={status} projectId={id} status={status} />
          ))}
        </div>
      </div>
    </div>
  );
}
