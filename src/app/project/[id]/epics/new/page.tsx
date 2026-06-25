'use client';

import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAccessToken } from '@/utils/auth';
import { getProjectEpicsHref, setCurrentProjectId } from '@/utils/project';
import { parseSupabaseRestError, supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';

interface ProjectMember {
  id: string;
  name: string;
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

function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

const createEpicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required (minimum 3 characters).')
    .min(3, 'Title is required (minimum 3 characters).'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  assignee_id: z.string().optional(),
  deadline: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const selected = new Date(value);
      if (Number.isNaN(selected.getTime())) return false;
      selected.setHours(0, 0, 0, 0);
      return selected >= getTodayStart();
    }, 'Deadline must be today or a future date.'),
});

type CreateEpicFormValues = z.infer<typeof createEpicSchema>;

export default function CreateEpicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMembers, setIsFetchingMembers] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [members, setMembers] = useState<ProjectMember[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateEpicFormValues>({
    resolver: zodResolver(createEpicSchema),
    mode: 'onChange',
    defaultValues: { title: '', description: '', assignee_id: '', deadline: '' },
  });

  const descriptionValue = watch('description', '') ?? '';

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setCurrentProjectId(projectId);

    const fetchPageData = async () => {
      setIsFetchingMembers(true);

      try {
        const [membersResponse, projectResponse] = await Promise.all([
          fetch(supabaseRestUrl(`/get_project_members?project_id=eq.${projectId}`), {
            method: 'GET',
            headers: supabaseAuthHeaders(token),
          }),
          fetch(supabaseRestUrl(`/projects?id=eq.${projectId}&select=name`), {
            method: 'GET',
            headers: supabaseAuthHeaders(token),
          }),
        ]);

        if (membersResponse.status === 401 || projectResponse.status === 401) {
          router.replace('/login');
          return;
        }

        if (membersResponse.ok) {
          const membersData: Record<string, unknown>[] = await membersResponse.json();
          setMembers(membersData.map(normalizeMember).filter((member) => member.id));
        }

        if (projectResponse.ok) {
          const projectData: { name: string }[] = await projectResponse.json();
          setProjectName(projectData[0]?.name ?? '');
        }
      } catch {
        setApiError('Unable to load form data. Please try again.');
      } finally {
        setIsFetchingMembers(false);
      }
    };

    fetchPageData();
  }, [projectId, router]);

  const onSubmit = async (values: CreateEpicFormValues) => {
    setIsLoading(true);
    setApiError(null);

    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      router.replace('/login');
      return;
    }

    const body: Record<string, string> = {
      title: values.title.trim(),
      project_id: projectId,
    };

    const description = values.description?.trim();
    if (description) {
      body.description = description;
    }

    if (values.assignee_id) {
      body.assignee_id = values.assignee_id;
    }

    if (values.deadline) {
      body.deadline = values.deadline;
    }

    try {
      const response = await fetch(supabaseRestUrl('/epics'), {
        method: 'POST',
        headers: supabaseAuthHeaders(token),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const message = await parseSupabaseRestError(response, 'Unknown error');
        setApiError(`Failed to create epic: ${message}`);
        return;
      }

      router.push(getProjectEpicsHref(projectId));
    } catch {
      setApiError('Failed to create epic: Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbProjectName = (projectName || 'Project').toUpperCase();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ProjectBreadcrumb
        items={[
          { label: 'Projects', href: '/project' },
          { label: breadcrumbProjectName, href: getProjectEpicsHref(projectId) },
          { label: 'Epics', href: getProjectEpicsHref(projectId) },
          { label: 'New Epic', active: true },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">
          Create New Epic
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4A5568]">
          Define a major project phase or high-level milestone to group related tasks and track
          architectural progress.
        </p>
      </div>

      <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 shadow-sm sm:p-8">
        {apiError && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm font-medium text-[#D31818]">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              placeholder="e.g. Structural Foundation Phase"
              className={`w-full rounded-lg border bg-[#E2ECFF]/40 px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 transition-colors focus:outline-none ${
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

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
            >
              Description
            </label>
            <p className="mb-2 text-xs text-[#4A5568]">Optional</p>
            <textarea
              {...register('description')}
              id="description"
              rows={5}
              placeholder="Describe the scope and objectives of this epic..."
              className={`w-full resize-y rounded-lg border bg-[#E2ECFF]/40 px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 transition-colors focus:outline-none ${
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
                  descriptionValue.length > 500 ? 'text-[#D31818]' : 'text-[#D31818]/70'
                }`}
              >
                {descriptionValue.length} / 500 characters
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                disabled={isFetchingMembers}
                className="w-full appearance-none rounded-lg border border-[#CBD5E1] bg-[#E2ECFF]/40 px-4 py-3 text-sm text-[#0A192F] transition-colors focus:border-[#0046AD] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select a member...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="deadline"
                className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
              >
                Deadline
              </label>
              <input
                {...register('deadline')}
                id="deadline"
                type="date"
                min={today}
                className={`w-full rounded-lg border bg-[#E2ECFF]/40 px-4 py-3 text-sm text-[#0A192F] transition-colors focus:outline-none ${
                  errors.deadline
                    ? 'border-[#D31818] focus:border-[#D31818]'
                    : 'border-[#CBD5E1] focus:border-[#0046AD]'
                }`}
              />
              {errors.deadline && (
                <p className="mt-1.5 text-xs font-medium text-[#D31818]">
                  {errors.deadline.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse items-stretch gap-3 border-t border-[#CBD5E1]/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => router.push(getProjectEpicsHref(projectId))}
              className="inline-flex items-center justify-center px-2 py-2.5 text-sm font-semibold text-[#4A5568] transition-colors hover:text-[#0A192F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isFetchingMembers}
              className="inline-flex items-center justify-center rounded-lg bg-[#0046AD] px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2] disabled:bg-[#CBD5E1] sm:min-w-[160px]"
            >
              {isLoading ? 'Creating...' : 'Create Epic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
