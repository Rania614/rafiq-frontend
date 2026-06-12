'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAccessToken } from '@/utils/auth';
import { getProjectEpicsNewHref, setCurrentProjectId } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';

export default function ProjectEpicsPage({ params }: { params: Promise<{ id: string }> }) {
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
    <div className="mx-auto w-full max-w-6xl">
      <ProjectBreadcrumb
        items={[
          { label: 'Projects', href: '/project' },
          { label: breadcrumbProjectName },
          { label: 'Epics', active: true },
        ]}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">Project Epics</h1>
          <p className="mt-1 text-sm text-[#4A5568]">Manage epics for this project.</p>
        </div>
        <Link
          href={getProjectEpicsNewHref(id)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0046AD] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2] sm:w-auto"
        >
          <Plus size={16} />
          Create Epic
        </Link>
      </div>
    </div>
  );
}
