'use client';

import { use, useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CloudOff, MoreVertical, UserPlus, Users, X } from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAvatarLetters } from '@/utils/avatar';
import { getAccessToken } from '@/utils/auth';
import { setCurrentProjectId } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

type PageState = 'loading' | 'success' | 'error';

const SHADOW_SM = 'shadow-[0_1px_2px_0px_#0000000d]';

const GRADIENT_BUTTON_BASE = `inline-flex items-center justify-center rounded-sm bg-gradient-to-br from-[#003D9B] to-[#0052CC] text-white ${SHADOW_SM}`;

const INVITE_BUTTON_CLASS = `${GRADIENT_BUTTON_BASE} gap-2 px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-95`;

const TABLE_WRAPPER_CLASS = 'lg:mx-auto lg:max-w-5/6 xl:max-w-3/4 overflow-hidden';

const TABLE_HEAD_CLASS =
  'px-9 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#434654]';

const TABLE_ROW_CLASS = 'border-b border-[#E8EDFF] bg-white last:border-b-0';

const LABEL_CLASS = 'text-[11px] font-bold uppercase tracking-[0.6px] text-[#4F5F7B]';

const FIELD_CLASS =
  'w-full rounded-sm border-0 bg-[#E0E8FF] px-4 py-3.5 text-sm text-[#434654] placeholder:text-[#737685]/70 transition-colors focus:outline focus:outline-1 focus:outline-[#003D9B]';

const AVATAR_COLORS = [
  'bg-[#E0E8FF] text-[#003D9B]',
  'bg-[#D7E2FF] text-[#003D9B]',
  'bg-[#CDDDFF] text-[#4F5F7B]',
  'bg-[#E8EDFF] text-[#0052CC]',
  'bg-[#F1F3FF] text-[#434654]',
  'bg-[#D7E2FF] text-[#0052CC]',
];

const ROLE_BADGE_STYLES: Record<string, string> = {
  owner: 'bg-[#0052CC] text-white',
  admin: 'bg-[#CDDDFF] text-[#4F5F7B]',
  member: 'bg-[#D7E2FF] text-[#434654]',
  viewer: 'bg-[#E8EDFF] text-[#434654]',
};

const DEFAULT_ROLE_BADGE_STYLE = 'bg-[#D7E2FF] text-[#434654]';

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getRoleBadgeClass(role: string): string {
  return ROLE_BADGE_STYLES[role.toLowerCase()] ?? DEFAULT_ROLE_BADGE_STYLE;
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
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${getRoleBadgeClass(role)}`}
    >
      {role}
    </span>
  );
}

function MemberInfo({ member }: { member: ProjectMember }) {
  const avatarLetters = getAvatarLetters(member.name);
  const avatarColor = getAvatarColor(member.email || member.name);

  return (
    <div className="flex min-w-0 items-center gap-4">
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase ${avatarColor}`}
      >
        {avatarLetters}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold capitalize text-[#041B3C]">{member.name}</p>
        <p className="truncate text-[11px] text-[#434654]">{member.email}</p>
      </div>
    </div>
  );
}

function MemberActions({ member }: { member: ProjectMember }) {
  const isOwner = member.role.toLowerCase() === 'owner';

  if (isOwner) return null;

  return (
    <button
      type="button"
      className="rounded-sm p-1 text-[#434654]/60 transition-colors hover:bg-[#F1F3FF] hover:text-[#434654]"
      aria-label={`Actions for ${member.name}`}
    >
      <MoreVertical size={16} />
    </button>
  );
}

function MemberRowSkeletonDesktop() {
  return (
    <tr className={TABLE_ROW_CLASS}>
      <td className="px-9 py-5">
        <div className="flex animate-pulse items-center gap-4">
          <div className="size-12 shrink-0 rounded-lg bg-[#E8EDFF]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-4 w-24 max-w-full rounded bg-[#E8EDFF]" />
            <div className="h-3 w-36 max-w-full rounded bg-[#F1F3FF]" />
          </div>
        </div>
      </td>
      <td className="px-9 py-5 text-center">
        <div className="mx-auto inline-block h-6 w-16 animate-pulse rounded-full bg-[#E8EDFF]" />
      </td>
      <td className="px-9 py-5">
        <div className="flex animate-pulse justify-end">
          <div className="size-8 rounded-sm bg-[#F1F3FF]" />
        </div>
      </td>
    </tr>
  );
}

function MemberRowSkeletonMobile() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-white p-4">
      <div className="flex flex-1 animate-pulse items-center gap-4">
        <div className="size-12 shrink-0 rounded-lg bg-[#E8EDFF]" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-4 w-24 max-w-full rounded bg-[#E8EDFF]" />
          <div className="h-3 w-36 max-w-full rounded bg-[#F1F3FF]" />
        </div>
      </div>
      <div className="flex animate-pulse items-center gap-1">
        <div className="h-6 w-14 rounded-full bg-[#E8EDFF]" />
        <div className="size-8 rounded-sm bg-[#F1F3FF]" />
      </div>
    </div>
  );
}

function MembersLoadingView() {
  const skeletonRows = Array.from({ length: 4 });

  return (
    <>
      <header className="mb-5 flex animate-pulse items-center justify-between lg:mb-10">
        <div className="mx-auto h-10 w-48 max-w-full rounded-md bg-[#E8EDFF] lg:mx-0" />
        <div className="hidden h-10 w-36 rounded-md bg-[#E8EDFF] lg:block" />
      </header>

      <table
        className={`hidden w-full table-fixed border-collapse rounded-lg md:table ${TABLE_WRAPPER_CLASS}`}
      >
        <thead>
          <tr className="bg-[#F1F3FF]/50">
            <th className={`${TABLE_HEAD_CLASS} w-1/2`}>Member</th>
            <th className={`${TABLE_HEAD_CLASS} w-1/4 text-center`}>Role</th>
            <th className={`${TABLE_HEAD_CLASS} w-1/4 text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {skeletonRows.map((_, index) => (
            <MemberRowSkeletonDesktop key={index} />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {skeletonRows.map((_, index) => (
          <MemberRowSkeletonMobile key={index} />
        ))}
      </div>
    </>
  );
}

function MemberRowDesktop({ member }: { member: ProjectMember }) {
  return (
    <tr className={`${TABLE_ROW_CLASS} hidden md:table-row`}>
      <td className="w-1/2 px-9 py-5">
        <MemberInfo member={member} />
      </td>
      <td className="w-1/4 px-9 py-5 text-center">
        <RoleBadge role={member.role} />
      </td>
      <td className="w-1/4 px-9 py-5">
        <div className="flex justify-end">
          <MemberActions member={member} />
        </div>
      </td>
    </tr>
  );
}

function MemberRowMobile({ member }: { member: ProjectMember }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-white p-4 md:hidden">
      <MemberInfo member={member} />
      <div className="flex shrink-0 items-start gap-1">
        <RoleBadge role={member.role} />
        <MemberActions member={member} />
      </div>
    </div>
  );
}

function MembersEmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center sm:mx-auto sm:max-w-md lg:min-h-[60vh]">
      <div className="flex flex-col items-center gap-11">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-[#F1F3FF] text-[#0052CC]">
          <Users size={36} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-[28px] font-semibold tracking-[-0.75px] text-[#041B3C]">
            No members yet
          </h2>
          <p className="text-sm leading-6 tracking-[0.6px] text-[#434654]">
            This project doesn&apos;t have any members. Invite teammates to collaborate on tasks and
            epics.
          </p>
        </div>
        <button type="button" onClick={onInvite} className={INVITE_BUTTON_CLASS}>
          <UserPlus size={18} />
          Invite member
        </button>
      </div>
    </div>
  );
}

function MembersErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center lg:min-h-[70vh]">
      <div className="flex flex-col items-center gap-11 sm:max-w-md">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#FFDBD6] text-[#BA1A1A]">
          <CloudOff size={32} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-[28px] font-semibold tracking-[-0.75px] text-[#041B3C]">
            Something went wrong
          </h2>
          <p className="text-sm leading-6 text-[#434654]">
            We&apos;re having trouble retrieving project members right now. Please try again in a
            moment.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className={`${GRADIENT_BUTTON_BASE} px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-95`}
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}

interface InviteMemberModalProps {
  onClose: () => void;
}

function InviteMemberModal({ onClose }: InviteMemberModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#041B3C]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-member-title"
    >
      <div
        className={`relative w-full max-w-lg rounded-sm bg-white p-6 sm:p-8 ${SHADOW_SM}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-sm p-1 text-[#434654] transition-colors hover:bg-[#F1F3FF]"
          aria-label="Close invite member dialog"
        >
          <X size={18} />
        </button>

        <header className="mb-8 pr-8">
          <h2
            id="invite-member-title"
            className="text-2xl font-semibold capitalize leading-8 text-[#041B3C]"
          >
            invite member
          </h2>
          <p className="mt-1 text-sm text-[#434654]">
            Send an invitation to add a new collaborator to this project.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-email" className={LABEL_CLASS}>
              email address <span className="text-[#BA1A1A]">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              required
              placeholder="colleague@company.com"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-role" className={LABEL_CLASS}>
              role
            </label>
            <select id="invite-role" defaultValue="member" className={FIELD_CLASS}>
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-sm px-6 py-3 text-base font-bold text-[#4F5F7B] transition-colors hover:text-[#041B3C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${GRADIENT_BUTTON_BASE} px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-95`}
            >
              Send Invitation
            </button>
          </div>
        </form>
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
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const openInviteModal = () => setIsInviteOpen(true);
  const closeInviteModal = () => setIsInviteOpen(false);

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
  const showPageHeader = pageState !== 'loading';

  return (
    <section>
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
        <>
          <table
            className={`hidden w-full table-fixed border-collapse rounded-lg md:table ${TABLE_WRAPPER_CLASS}`}
          >
            <thead>
              <tr className="bg-[#F1F3FF]/50">
                <th className={`${TABLE_HEAD_CLASS} w-1/2`}>Member</th>
                <th className={`${TABLE_HEAD_CLASS} w-1/4 text-center`}>Role</th>
                <th className={`${TABLE_HEAD_CLASS} w-1/4 text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <MemberRowDesktop key={member.id} member={member} />
              ))}
            </tbody>
          </table>

          <div className="flex flex-col gap-3 md:hidden">
            {members.map((member) => (
              <MemberRowMobile key={member.id} member={member} />
            ))}
          </div>
        </>
      )}

      {isInviteOpen && <InviteMemberModal onClose={closeInviteModal} />}
    </section>
  );
}
