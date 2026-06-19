'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAccessToken } from '@/utils/auth';
import { getProjectTasksHref, setCurrentProjectId } from '@/utils/project';
import { TASK_STATUSES, type TaskStatus } from '@/utils/tasks';

export default function CreateTaskForm({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') ?? 'TO DO';
  const initialStatus = TASK_STATUSES.includes(statusParam as TaskStatus)
    ? (statusParam as TaskStatus)
    : 'TO DO';

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setCurrentProjectId(projectId);
  }, [projectId, router]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ProjectBreadcrumb
        items={[
          { label: 'Projects', href: '/project' },
          { label: 'Project' },
          { label: 'Tasks', href: getProjectTasksHref(projectId) },
          { label: 'New Task', active: true },
        ]}
      />

      <h1 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">Create Task</h1>
      <p className="mt-1 text-sm text-[#4A5568]">Add a new task to this project.</p>

      <form className="mt-8 space-y-6 rounded-xl border border-[#CBD5E1] bg-white p-6 shadow-sm">
        <div>
          <label
            htmlFor="status"
            className="mb-1.5 block text-xs font-bold tracking-wider text-[#4A5568] uppercase"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initialStatus}
            className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0A192F] focus:border-[#0046AD] focus:outline-none focus:ring-1 focus:ring-[#0046AD]"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Link
            href={getProjectTasksHref(projectId)}
            className="rounded-xl border border-[#CBD5E1] px-5 py-2.5 text-sm font-semibold text-[#4A5568] transition-colors hover:bg-[#F4F7FF]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
