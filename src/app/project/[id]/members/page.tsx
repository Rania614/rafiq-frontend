'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, UserPlus, X } from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAccessToken } from '@/utils/auth';
import { setCurrentProjectId } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';
import { normalizeProjectMember, type ProjectMember } from '@/utils/members';

import { INVITE_BUTTON_CLASS } from './constants';
import InviteMemberModal from './components/InviteMemberModal';
import MembersTable from './components/MembersTable';
import MembersEmptyState from './components/MembersEmptyState';
import MembersLoadingView from './components/MembersLoadingView';
import MembersErrorState from './components/MembersErrorState';

type PageState = 'loading' | 'success' | 'error';

export default function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const openInviteModal = () => setIsInviteOpen(true);
  const closeInviteModal = () => setIsInviteOpen(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchMembers = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setPageState('loading');

    try {
      const [membersResponse, projectResponse] = await Promise.all([
        fetch(supabaseRestUrl(`/get_project_members?project_id=eq.${id}`), {
          method: 'GET',
          headers: supabaseAuthHeaders(token),
        }),
        fetch(supabaseRestUrl(`/projects?id=eq.${id}&select=name`), {
          method: 'GET',
          headers: supabaseAuthHeaders(token),
        }),
      ]);

      if (membersResponse.status === 401 || projectResponse.status === 401) {
        router.replace('/login');
        return;
      }

      if (!membersResponse.ok) {
        setPageState('error');
        return;
      }

      const membersData: Record<string, unknown>[] = await membersResponse.json();
      setMembers(membersData.map(normalizeProjectMember));

      if (projectResponse.ok) {
        const projectData: { name: string }[] = await projectResponse.json();
        setProjectName(projectData[0]?.name ?? '');
      }

      setPageState('success');
    } catch {
      setPageState('error');
    }
  }, [id, router]);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
      return;
    }

    setCurrentProjectId(id);
    fetchMembers();
  }, [id, router, fetchMembers]);

  const breadcrumbProjectName = (projectName || 'Project').toUpperCase();
  const showPageHeader = pageState !== 'loading';

  return (
    <section>
      {toast && (
        <div
          role="status"
          className={`fixed top-20 right-4 left-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-sm border bg-white px-4 py-3 shadow-[0_1px_2px_0px_#0000000d] sm:right-6 sm:left-auto ${
            toast.type === 'success' ? 'border-[#82F9BE]/40' : 'border-[#FFDBD6]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-[#003D9B]" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-[#BA1A1A]" />
          )}
          <p className="flex-1 text-sm font-semibold text-[#041B3C]">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
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
          { label: breadcrumbProjectName },
          { label: 'Members', active: true },
        ]}
      />

      {pageState === 'loading' && <MembersLoadingView />}

      {showPageHeader && (
        <header className="mb-5 flex items-center justify-between lg:mb-10">
          <h1 className="w-full flex-1 text-center text-[30px] font-semibold capitalize leading-9 tracking-[-0.75px] text-[#041B3C] lg:text-left lg:text-[36px] lg:leading-10 lg:tracking-[-0.9px]">
            project members
          </h1>
          <button
            type="button"
            onClick={openInviteModal}
            className={`${INVITE_BUTTON_CLASS} hidden lg:inline-flex`}
          >
            <UserPlus size={18} />
            Invite member
          </button>
        </header>
      )}

      {pageState === 'error' && <MembersErrorState onRetry={fetchMembers} />}

      {pageState === 'success' && members.length === 0 && (
        <MembersEmptyState onInvite={openInviteModal} />
      )}

      {pageState === 'success' && members.length > 0 && (
        <MembersTable members={members} />
      )}

      {isInviteOpen && (
        <InviteMemberModal
          projectId={id}
          onClose={closeInviteModal}
          onSuccess={(message) => {
            closeInviteModal();
            setToast({ message, type: 'success' });
          }}
        />
      )}
    </section>
  );
}
