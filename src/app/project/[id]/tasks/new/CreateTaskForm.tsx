'use client';

import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAccessToken } from '@/utils/auth';
import { getProjectTasksHref, setCurrentProjectId } from '@/utils/project';
import { TASK_STATUSES, type TaskStatus } from '@/utils/tasks';
import {
  parseSupabaseRestError,
  supabaseAuthHeaders,
  supabaseRestUrl,
} from '@/utils/supabase';

interface ProjectMember {
  id: string;
  name: string;
}

interface Epic {
  id: string;
  epic_id: string;
  title: string;
}

function normalizeMember(raw: Record<string, unknown>): ProjectMember {
  const metadata = (raw.user_metadata ?? raw.raw_user_meta_data) as
    | Record<string, string>
    | undefined;

  return {
    id: String(raw.user_id ?? raw.id ?? ''),
    name: String(raw.name ?? raw.full_name ?? metadata?.name ?? raw.user_name ?? 'Unknown'),
  };
}

const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .min(3, 'Title must be at least 3 characters.'),
  status: z.string().min(1, 'Status is required.'),
  assignee_id: z.string().optional(),
  epic_id: z.string().optional(),
  due_date: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const selected = new Date(value);
      if (Number.isNaN(selected.getTime())) return false;
      const today = new Date();
      today.setSeconds(0, 0); // Ignore seconds/milliseconds for future check
      return selected >= today;
    }, 'Due date must be in the future.'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters.').optional(),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

export default function CreateTaskForm({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse status query parameter (handle both space and underscore format)
  const rawStatus = searchParams.get('status') ?? 'TO DO';
  const statusParam = rawStatus.replace(/_/g, ' ');
  const initialStatus = TASK_STATUSES.includes(statusParam as TaskStatus)
    ? (statusParam as TaskStatus)
    : 'TO DO';

  const epicIdParam = searchParams.get('epic_id') ?? '';

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      status: initialStatus,
      assignee_id: '',
      epic_id: epicIdParam,
      due_date: '',
      description: '',
    },
  });

  const descriptionValue = watch('description', '') ?? '';

  // Synchronize epic_id if query parameter is updated
  useEffect(() => {
    if (epicIdParam) {
      setValue('epic_id', epicIdParam);
    }
  }, [epicIdParam, setValue]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setCurrentProjectId(projectId);

    const fetchData = async () => {
      setIsFetchingData(true);
      setApiError(null);

      try {
        const [membersResponse, epicsResponse, projectResponse] = await Promise.all([
          fetch(supabaseRestUrl(`/get_project_members?project_id=eq.${projectId}`), {
            method: 'GET',
            headers: supabaseAuthHeaders(token),
          }),
          fetch(supabaseRestUrl(`/project_epics?project_id=eq.${projectId}`), {
            method: 'GET',
            headers: supabaseAuthHeaders(token),
          }),
          fetch(supabaseRestUrl(`/projects?id=eq.${projectId}&select=name`), {
            method: 'GET',
            headers: supabaseAuthHeaders(token),
          }),
        ]);

        if (
          membersResponse.status === 401 ||
          epicsResponse.status === 401 ||
          projectResponse.status === 401
        ) {
          router.replace('/login');
          return;
        }

        if (membersResponse.ok) {
          const membersData: Record<string, unknown>[] = await membersResponse.json();
          setMembers(membersData.map(normalizeMember).filter((member) => member.id));
        }

        if (epicsResponse.ok) {
          const epicsData: Epic[] = await epicsResponse.json();
          setEpics(epicsData);
        }

        if (projectResponse.ok) {
          const projectData: { name: string }[] = await projectResponse.json();
          setProjectName(projectData[0]?.name ?? '');
        }
      } catch {
        setApiError('Unable to load form data. Please refresh and try again.');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();
  }, [projectId, router]);

  const onSubmit = async (values: CreateTaskFormValues) => {
    setIsLoading(true);
    setApiError(null);

    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      router.replace('/login');
      return;
    }

    // Build the request body mapping space status to underscore status
    const body: Record<string, any> = {
      project_id: projectId,
      title: values.title.trim(),
      status: values.status.replace(/ /g, '_'),
    };

    if (values.description?.trim()) {
      body.description = values.description.trim();
    }

    if (values.assignee_id) {
      body.assignee_id = values.assignee_id;
    }

    if (values.epic_id) {
      body.epic_id = values.epic_id;
    }

    if (values.due_date) {
      body.due_date = new Date(values.due_date).toISOString();
    }

    try {
      const response = await fetch(supabaseRestUrl('/tasks'), {
        method: 'POST',
        headers: supabaseAuthHeaders(token),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const message = await parseSupabaseRestError(response, 'Unknown error');
        setApiError(`Failed to create task: ${message}`);
        return;
      }

      router.push(getProjectTasksHref(projectId));
    } catch {
      setApiError('Failed to create task: Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbProjectName = (projectName || 'Project').toUpperCase();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ProjectBreadcrumb
        items={[
          { label: 'Projects', href: '/project' },
          { label: breadcrumbProjectName, href: getProjectTasksHref(projectId) },
          { label: 'Tasks', href: getProjectTasksHref(projectId) },
          { label: 'New Task', active: true },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">
          Create New Task
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4A5568]">
          Initialize a new work item within the Architectural Workspace ecosystem.
        </p>
      </div>

      <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 shadow-sm sm:p-8">
        {apiError && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm font-medium text-[#D31818]">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
            >
              Title <span className="text-[#D31818]">*</span>
            </label>
            <input
              {...register('title')}
              id="title"
              type="text"
              placeholder="e.g., Finalize structural schematics"
              className={`w-full rounded-lg border bg-[#E2ECFF]/30 px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 transition-colors focus:outline-none ${
                errors.title
                  ? 'border-[#D31818] focus:border-[#D31818]'
                  : 'border-[#CBD5E1] focus:border-[#0046AD]'
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#D31818] uppercase">
                <AlertCircle size={14} className="shrink-0" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Status & Assignee */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="status"
                className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
              >
                Status <span className="text-[#D31818]">*</span>
              </label>
              <select
                {...register('status')}
                id="status"
                className="w-full appearance-none rounded-lg border border-[#CBD5E1] bg-[#E2ECFF]/30 px-4 py-3 text-sm text-[#0A192F] transition-colors focus:border-[#0046AD] focus:outline-none"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="assignee_id"
                className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
              >
                Assignee
              </label>
              <select
                {...register('assignee_id')}
                id="assignee_id"
                disabled={isFetchingData}
                className="w-full appearance-none rounded-lg border border-[#CBD5E1] bg-[#E2ECFF]/30 px-4 py-3 text-sm text-[#0A192F] transition-colors focus:border-[#0046AD] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {isFetchingData ? 'Loading team members...' : 'Select Team Member'}
                </option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Epic */}
          <div>
            <label
              htmlFor="epic_id"
              className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
            >
              Epic
            </label>
            <select
              {...register('epic_id')}
              id="epic_id"
              disabled={isFetchingData}
              className="w-full appearance-none rounded-lg border border-[#CBD5E1] bg-[#E2ECFF]/30 px-4 py-3 text-sm text-[#0A192F] transition-colors focus:border-[#0046AD] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isFetchingData ? 'Loading epics...' : 'Select Epic Link'}
              </option>
              {epics.map((epic) => {
                const displayTitle =
                  epic.title.length > 100
                    ? `${epic.title.slice(0, 100)}...`
                    : epic.title;
                return (
                  <option key={epic.id} value={epic.id}>
                    {epic.epic_id} {displayTitle}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="due_date"
              className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
            >
              Due Date
            </label>
            <input
              {...register('due_date')}
              id="due_date"
              type="datetime-local"
              className={`w-full rounded-lg border bg-[#E2ECFF]/30 px-4 py-3 text-sm text-[#0A192F] transition-colors focus:outline-none ${
                errors.due_date
                  ? 'border-[#D31818] focus:border-[#D31818]'
                  : 'border-[#CBD5E1] focus:border-[#0046AD]'
              }`}
            />
            {errors.due_date && (
              <p className="mt-1.5 text-xs font-medium text-[#D31818]">{errors.due_date.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
            >
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={5}
              placeholder="Provide detailed context for this task..."
              className={`w-full resize-y rounded-lg border bg-[#E2ECFF]/30 px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 transition-colors focus:outline-none ${
                errors.description
                  ? 'border-[#D31818] focus:border-[#D31818]'
                  : 'border-[#CBD5E1] focus:border-[#0046AD]'
              }`}
            />
            <div className="mt-1.5 flex items-start justify-between gap-2">
              {errors.description ? (
                <p className="text-xs font-medium text-[#D31818]">{errors.description.message}</p>
              ) : (
                <span />
              )}
              <span
                className={`shrink-0 text-[10px] font-medium ${
                  descriptionValue.length > 1000 ? 'text-[#D31818]' : 'text-[#D31818]/70'
                }`}
              >
                {descriptionValue.length} / 1000 characters
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-6 border-t border-[#CBD5E1]/60 pt-6">
            <button
              type="button"
              onClick={() => router.push(getProjectTasksHref(projectId))}
              className="text-sm font-semibold text-[#4A5568] hover:text-[#0A192F] transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || isFetchingData}
              className="inline-flex items-center justify-center rounded-lg bg-[#0046AD] px-8 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#0056D2] disabled:bg-[#CBD5E1] disabled:cursor-not-allowed sm:min-w-[160px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
