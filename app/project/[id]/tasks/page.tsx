'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAccessToken } from '@/utils/auth';
import { setCurrentProjectId } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';

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
    <div className="mx-auto w-full max-w-6xl">
      <ProjectBreadcrumb
        items={[
          { label: 'Projects', href: '/project' },
          { label: breadcrumbProjectName },
          { label: 'Tasks', active: true },
        ]}
      />

      <h1 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">Project Tasks</h1>
      <p className="mt-1 text-sm text-[#4A5568]">Manage tasks for this project.</p>
    </div>
  );
}
