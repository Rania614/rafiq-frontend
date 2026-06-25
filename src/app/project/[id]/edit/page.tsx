'use client';

import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Settings2, UserPlus, X } from 'lucide-react';
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

const LABEL_CLASS = 'text-[11px] font-bold uppercase tracking-[0.6px] text-[#4F5F7B]';
const LABEL_ERROR_CLASS = 'text-[11px] font-bold uppercase tracking-[0.6px] text-[#BA1A1A]';

const FIELD_BASE_CLASS =
  'w-full rounded-sm px-4 py-3.5 text-sm text-[#434654] placeholder:text-[#737685]/70 transition-colors focus:outline focus:outline-1';

const FIELD_DEFAULT_CLASS = `${FIELD_BASE_CLASS} border-0 bg-[#E0E8FF] focus:outline-[#003D9B]`;
const FIELD_ERROR_CLASS = `${FIELD_BASE_CLASS} border-0 bg-[#FFDBD6] text-[#93000A] focus:outline-[#BA1A1A]`;

const SHADOW_SM = 'shadow-[0_1px_2px_0px_#0000000d]';

const GRADIENT_BUTTON_BASE = `inline-flex items-center justify-center rounded-sm bg-gradient-to-br from-[#003D9B] to-[#0052CC] text-white ${SHADOW_SM}`;

const PRIMARY_BUTTON_CLASS = `${GRADIENT_BUTTON_BASE} px-8 py-3 text-base font-semibold transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 lg:min-w-[140px]`;

const INVITE_BUTTON_CLASS = `${GRADIENT_BUTTON_BASE} gap-2 px-6 py-2.5 text-sm font-semibold`;

const GHOST_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-sm px-6 py-3 text-base font-bold text-[#4F5F7B] transition-colors hover:text-[#041B3C] lg:min-w-[120px]';

const SUCCESS_TOAST_CLASS = `fixed top-20 right-4 left-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-sm border border-[#82F9BE]/40 bg-white px-4 py-3 ${SHADOW_SM} sm:right-6 sm:left-auto`;

const ERROR_TEXT_CLASS = 'text-[11px] font-medium text-[#BA1A1A]';

const PAGE_TITLE = 'edit project';

const FORM_SUBTITLE = 'Define the scope and foundational details of your project.';

const PRO_TIP_TEXT =
  'You can invite project members and assign epics immediately after the initial creation process.';

const SECTION_CLASS =
  'mb-10 lg:mx-auto lg:max-w-[80%] lg:rounded-t-2xl lg:bg-white lg:shadow-[0_1px_2px_0px_#0000000d] xl:max-w-3/4 2xl:max-w-1/2';

const getLabelClass = (hasError: boolean) => (hasError ? LABEL_ERROR_CLASS : LABEL_CLASS);

const getFieldClass = (hasError: boolean) => (hasError ? FIELD_ERROR_CLASS : FIELD_DEFAULT_CLASS);

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
        <div role="status" className={SUCCESS_TOAST_CLASS}>
          <CheckCircle2 size={18} className="shrink-0 text-[#003D9B]" />
          <p className="flex-1 text-sm font-semibold text-[#041B3C]">
            Project updated successfully
          </p>
          <button
            type="button"
            onClick={() => setSuccessToast(false)}
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
          { label: breadcrumbTitle },
          { label: 'Edit', active: true },
        ]}
      />

      <header className="mb-10 hidden items-center justify-between lg:flex">
        <h1 className="flex-1 text-[36px] font-semibold capitalize leading-10 tracking-[-0.9px] text-[#041B3C]">
          {PAGE_TITLE}
        </h1>
        <button type="button" className={INVITE_BUTTON_CLASS}>
          <UserPlus size={18} />
          Invite member
        </button>
      </header>

      <section className={SECTION_CLASS}>
        <div className="pb-12 lg:p-9 lg:pb-10">
          <header className="mb-9 flex items-center gap-4 lg:mb-10">
            <div className="hidden items-center justify-center rounded-sm bg-[#0052CC]/10 p-3 lg:flex">
              <Settings2 size={22} className="text-[#0052CC]" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold capitalize leading-8 text-[#041B3C]">
                {PAGE_TITLE}
              </h2>
              <p className="text-sm text-[#4F5F7B]">{FORM_SUBTITLE}</p>
            </div>
          </header>

          {apiError && (
            <div className="mb-6 rounded-sm bg-[#FFDBD6] p-3 text-sm font-medium text-[#BA1A1A]">
              {apiError}
            </div>
          )}

          {isFetching ? (
            <div className="flex flex-col gap-9 py-2">
              <div className="h-[52px] animate-pulse rounded-sm bg-[#E8EDFF]" />
              <div className="h-36 animate-pulse rounded-sm bg-[#E8EDFF]" />
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="h-12 w-28 animate-pulse rounded-sm bg-[#E8EDFF]" />
                <div className="h-12 w-40 animate-pulse rounded-sm bg-[#E8EDFF]" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-9">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className={getLabelClass(!!errors.name)}>
                    project title <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <input
                    {...register('name')}
                    id="name"
                    type="text"
                    placeholder="Enter project title"
                    className={getFieldClass(!!errors.name)}
                  />
                  {errors.name && <p className={ERROR_TEXT_CLASS}>{errors.name.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="description"
                    className={`flex items-center justify-between gap-3 ${getLabelClass(!!errors.description)}`}
                  >
                    <span>description</span>
                    <span className="normal-case tracking-normal text-[#4F5F7B]/60">Optional</span>
                  </label>
                  <textarea
                    {...register('description')}
                    id="description"
                    rows={5}
                    placeholder="Provide a high-level overview of the project's architectural objectives and key milestones..."
                    className={`resize-y ${getFieldClass(!!errors.description)}`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    {errors.description ? (
                      <p className={ERROR_TEXT_CLASS}>{errors.description.message}</p>
                    ) : (
                      <span />
                    )}
                    <span
                      className={`shrink-0 text-[11px] font-medium ${
                        descriptionValue.length > 500 ? 'text-[#BA1A1A]' : 'text-[#4F5F7B]'
                      }`}
                    >
                      {descriptionValue.length}/500 characters
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <button
                    type="button"
                    onClick={() => router.push('/project')}
                    className={`${GHOST_BUTTON_CLASS} order-1 lg:order-0`}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className={PRIMARY_BUTTON_CLASS}>
                    {isLoading ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="rounded-b-lg bg-[#F1F3FF] p-6 text-sm text-[#4F5F7B]">
          <p className="flex flex-col gap-2 lg:block">
            <span className="font-bold text-[#041B3C]">Pro Tip: </span>
            <span>{PRO_TIP_TEXT}</span>
          </p>
        </div>
      </section>
    </>
  );
}
