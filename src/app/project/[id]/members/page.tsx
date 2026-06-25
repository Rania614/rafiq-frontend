'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloudOff, MoreVertical, UserPlus } from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAvatarLetters } from '@/utils/avatar';
import { getAccessToken } from '@/utils/auth';
import { setCurrentProjectId } from '@/utils/project';
import { parseSupabaseRestError, supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

type PageState = 'loading' | 'success' | 'error';

const AVATAR_COLORS = [
  'bg-[#E2ECFF] text-[#0046AD]',
  'bg-[#D1FAE5] text-[#047857]',
  'bg-[#CCFBF1] text-[#0F766E]',
  'bg-[#FEF3C7] text-[#B45309]',
  'bg-[#FCE7F3] text-[#BE185D]',
  'bg-[#EDE9FE] text-[#6D28D9]',
];

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function normalizeMember(raw: Record<string, unknown>): ProjectMember {
  const metadata = (raw.user_metadata ?? raw.raw_user_meta_data) as
    | Record<string, string>
    | undefined;

  const name = String(raw.name ?? raw.full_name ?? metadata?.name ?? raw.user_name ?? 'Unknown');
  const email = String(raw.email ?? '');
  const role = String(raw.role ?? 'member').toLowerCase();

  return {
    id: String(raw.user_id ?? raw.id ?? email ?? name),
    name,
    email,
    role,
  };
}

function RoleBadge({ role }: { role: string }) {
  const label = role.toUpperCase();
  const isOwner = role.toLowerCase() === 'owner';

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${
        isOwner ? 'bg-[#0046AD] text-white' : 'bg-[#E2ECFF] text-[#0046AD]'
      }`}
    >
      {label}
    </span>
  );
}

function MemberRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-[#CBD5E1]/60 px-4 py-4 last:border-b-0 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-[#CBD5E1]/60" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-36 max-w-full animate-pulse rounded-md bg-[#CBD5E1]/60" />
          <div className="h-3 w-52 max-w-full animate-pulse rounded-md bg-[#CBD5E1]/40" />
        </div>
      </div>
      <div className="h-6 w-16 shrink-0 animate-pulse rounded-full bg-[#CBD5E1]/60" />
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-[#CBD5E1]/40" />
    </div>
  );
}

function MembersTableSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#CBD5E1] bg-white shadow-sm">
      <div className="hidden border-b border-[#CBD5E1]/60 px-6 py-3 sm:grid sm:grid-cols-[1fr_120px_48px] sm:gap-4">
        <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
          Member
        </span>
        <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">Role</span>
        <span className="text-right text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
          Actions
        </span>
      </div>
      {Array.from({ length: count }).map((_, index) => (
        <MemberRowSkeleton key={index} />
      ))}
    </div>
  );
}

function MemberRow({ member }: { member: ProjectMember }) {
  const avatarLetters = getAvatarLetters(member.name);
  const avatarColor = getAvatarColor(member.email || member.name);
  const isOwner = member.role.toLowerCase() === 'owner';

  return (
    <div className="flex items-center gap-4 border-b border-[#CBD5E1]/60 px-4 py-4 last:border-b-0 sm:grid sm:grid-cols-[1fr_120px_48px] sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${avatarColor}`}
        >
          {avatarLetters}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0A192F]">{member.name}</p>
          <p className="truncate text-xs text-[#4A5568]">{member.email}</p>
        </div>
      </div>

      <div className="shrink-0 sm:justify-self-start">
        <RoleBadge role={member.role} />
      </div>

      <div className="ml-auto flex shrink-0 justify-end sm:ml-0">
        {!isOwner && (
          <button
            type="button"
            className="rounded-lg p-2 text-[#4A5568] transition-colors hover:bg-[#F4F7FF] hover:text-[#0A192F]"
            aria-label={`Actions for ${member.name}`}
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [projectName, setProjectName] = useState('');

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
      setMembers(membersData.map(normalizeMember));

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
    // Data load intentionally triggered from effect; fetchMembers updates local UI state.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preserve existing members fetch flow
    fetchMembers();
  }, [id, router, fetchMembers]);

  const breadcrumbProjectName = (projectName || 'Project').toUpperCase();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <ProjectBreadcrumb
        items={[
          { label: 'Projects', href: '/project' },
          { label: breadcrumbProjectName },
          { label: 'Members', active: true },
        ]}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">
          Project Members
        </h1>
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0046AD] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2] sm:w-auto"
        >
          <UserPlus size={16} />
          Invite Member
        </button>
      </div>

      {pageState === 'loading' && <MembersTableSkeleton />}

      {pageState === 'error' && (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-[#CBD5E1] bg-white px-4 py-16 text-center shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#D31818]">
            <CloudOff size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#0A192F] sm:text-2xl">
            Failed to load project members
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4A5568]">
            Failed to load project members. Please try again.
          </p>
          <button
            type="button"
            onClick={fetchMembers}
            className="mt-8 rounded-xl bg-[#0046AD] px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2]"
          >
            Retry
          </button>
        </div>
      )}

      {pageState === 'success' && (
        <div className="overflow-hidden rounded-xl border border-[#CBD5E1] bg-white shadow-sm">
          <div className="hidden border-b border-[#CBD5E1]/60 px-6 py-3 sm:grid sm:grid-cols-[1fr_120px_48px] sm:gap-4">
            <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
              Member
            </span>
            <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
              Role
            </span>
            <span className="text-right text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
              Actions
            </span>
          </div>

          {members.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[#4A5568]">
              No members found for this project.
            </div>
          ) : (
            members.map((member) => <MemberRow key={member.id} member={member} />)
          )}
        </div>
      )}
    </div>
  );
}
