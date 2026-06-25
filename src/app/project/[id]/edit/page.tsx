'use client';

import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileCheck, Lightbulb, UserPlus, X } from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAccessToken } from '@/utils/auth';
import { setCurrentProjectId } from '@/utils/project';
import { parseSupabaseRestError, supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';

const editProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project title is required')
    .min(3, 'Project name must be at least 3 characters.')
    .max(100, 'Project title must not exceed 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

interface Project {
  id: string;
  name: string;
  description?: string | null;
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    mode: 'onChange',
    defaultValues: { name: '', description: '' },
  });

  const descriptionValue = watch('description', '') ?? '';
  const nameValue = watch('name', '') ?? '';

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
      return;
    }

    setCurrentProjectId(id);
  }, [id, router]);

  useEffect(() => {
    if (!successToast) return;

    const timer = setTimeout(() => setSuccessToast(false), 4000);
    return () => clearTimeout(timer);
  }, [successToast]);

  useEffect(() => {
    const fetchProject = async () => {
      const token = getAccessToken();
      if (!token) return;

      setIsFetching(true);
      setApiError(null);

      try {
        const response = await fetch(supabaseRestUrl(`/projects?id=eq.${id}&select=*`), {
          method: 'GET',
          headers: supabaseAuthHeaders(token),
        });

        if (!response.ok) {
          const message = await parseSupabaseRestError(response, 'Unknown error');
          setApiError(`Failed to load project: ${message}`);
          return;
        }

        const data: Project[] = await response.json();
        const project = data[0];

        if (!project) {
          setApiError('Project not found.');
          return;
        }

        setProjectTitle(project.name);
        reset({
          name: project.name,
          description: project.description ?? '',
        });
      } catch {
        setApiError('Failed to load project: Unable to connect. Please try again.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchProject();
  }, [id, reset]);

  const onSubmit = async (values: EditProjectFormValues) => {
    setIsLoading(true);
    setApiError(null);

    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      router.replace('/login');
      return;
    }

    const body: { name: string; description?: string | null } = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
    };

    try {
      const response = await fetch(supabaseRestUrl(`/projects?id=eq.${id}`), {
        method: 'PATCH',
        headers: {
          ...supabaseAuthHeaders(token),
          Prefer: 'return=representation',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const message = await parseSupabaseRestError(response, 'Unknown error');
        setApiError(`Failed to update project: ${message}`);
        return;
      }

      const updated: Project[] = await response.json();
      const title = updated[0]?.name ?? values.name.trim();
      setProjectTitle(title);
      setSuccessToast(true);
    } catch {
      setApiError('Failed to update project: Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbTitle = (nameValue.trim() || projectTitle || 'Project').toUpperCase();

  return (
    <>
      {successToast && (
        <div
          role="status"
          className="fixed top-20 right-4 left-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-[#70FFB5]/40 bg-white px-4 py-3 shadow-lg sm:right-6 sm:left-auto"
        >
          <CheckCircle2 size={18} className="shrink-0 text-[#0046AD]" />
          <p className="flex-1 text-sm font-semibold text-[#0A192F]">
            Project updated successfully
          </p>
          <button
            type="button"
            onClick={() => setSuccessToast(false)}
            className="rounded-lg p-1 text-[#4A5568] hover:bg-[#F4F7FF]"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-4xl">
        <ProjectBreadcrumb
          items={[
            { label: 'Projects', href: '/project' },
            { label: breadcrumbTitle },
            { label: 'Edit', active: true },
          ]}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">
            Edit Project
          </h1>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0A192F] shadow-sm transition-colors hover:bg-[#F4F7FF] sm:w-auto"
          >
            <UserPlus size={16} className="text-[#0046AD]" />
            Invite Member
          </button>
        </div>

        <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E2ECFF] text-[#0046AD]">
              <FileCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0A192F] sm:text-xl">Edit Project</h2>
              <p className="mt-1 text-sm text-[#4A5568]">
                Define the scope and foundational details of your project.
              </p>
            </div>
          </div>

          {apiError && (
            <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm font-medium text-[#D31818]">
              {apiError}
            </div>
          )}

          {isFetching ? (
            <div className="space-y-4 py-4">
              <div className="h-10 animate-pulse rounded-lg bg-[#CBD5E1]/50" />
              <div className="h-32 animate-pulse rounded-lg bg-[#CBD5E1]/50" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
                >
                  Project Title <span className="text-[#D31818]">*</span>
                </label>
                <input
                  {...register('name')}
                  id="name"
                  type="text"
                  placeholder="Project Title"
                  className={`w-full rounded-lg border bg-[#E2ECFF]/40 px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 transition-colors focus:outline-none ${
                    errors.name
                      ? 'border-[#D31818] focus:border-[#D31818]'
                      : 'border-[#CBD5E1] focus:border-[#0046AD]'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs font-medium text-[#D31818]">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#0A192F] uppercase"
                >
                  Description{' '}
                  <span className="font-semibold normal-case tracking-normal text-[#4A5568]">
                    Optional
                  </span>
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={5}
                  placeholder="Provide a high-level overview of the project's architectural objectives and key milestones..."
                  className={`w-full resize-y rounded-lg border bg-[#E2ECFF]/40 px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 transition-colors focus:outline-none ${
                    errors.description
                      ? 'border-[#D31818] focus:border-[#D31818]'
                      : 'border-[#CBD5E1] focus:border-[#0046AD]'
                  }`}
                />
                <div className="mt-1.5 flex items-start justify-between gap-2">
                  {errors.description ? (
                    <p className="text-xs font-medium text-[#D31818]">
                      {errors.description.message}
                    </p>
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

              <div className="flex flex-col-reverse items-stretch gap-3 border-t border-[#CBD5E1]/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => router.push('/project')}
                  className="inline-flex items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-6 py-3 text-sm font-semibold text-[#4A5568] transition-colors hover:bg-[#F4F7FF] hover:text-[#0A192F] sm:min-w-[120px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-lg bg-[#0046AD] px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2] disabled:bg-[#CBD5E1] sm:min-w-[120px]"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex gap-3 rounded-lg border-l-4 border-[#0046AD] bg-[#F4F7FF] px-4 py-3">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#0046AD]" />
            <p className="text-xs leading-relaxed text-[#4A5568]">
              <span className="font-bold text-[#0046AD]">Pro Tip:</span> You can invite project
              members and assign epics immediately after the initial creation process.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
