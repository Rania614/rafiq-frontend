'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Compass,
  GitBranch,
  LayoutGrid,
  LineChart,
  Plus,
  Rocket,
  Sparkles,
  Zap,
} from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAvatarLetters } from '@/utils/avatar';
import { getAccessToken } from '@/utils/auth';
import { getProjectEpicsNewHref } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';

interface EpicUser {
  name?: string;
}

interface Epic {
  id: string;
  epic_id: string;
  title: string;
  created_at: string;
  created_by?: EpicUser | null;
  assignee?: EpicUser | null;
}

type PageState = 'loading' | 'success' | 'error' | 'empty';

function formatCreatedDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function EpicCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#CBD5E1] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[#CBD5E1]/60" />
        <div className="h-3 w-24 animate-pulse rounded-md bg-[#CBD5E1]/40" />
      </div>
      <div className="mb-3 h-4 w-3/4 animate-pulse rounded-md bg-[#CBD5E1]/60" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded-md bg-[#CBD5E1]/40" />
        <div className="h-3 w-5/6 animate-pulse rounded-md bg-[#CBD5E1]/40" />
      </div>
    </div>
  );
}

function EpicsLoadingState() {
  return (
    <>
      <div className="mb-4 h-3 w-56 animate-pulse rounded-md bg-[#CBD5E1]/50" />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-8 w-48 animate-pulse rounded-md bg-[#CBD5E1]/60" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 animate-pulse rounded-lg bg-[#CBD5E1]/50" />
          <div className="h-9 w-28 animate-pulse rounded-lg bg-[#CBD5E1]/50" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-[#CBD5E1]/50" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <EpicCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
}

function EmptyEpicsIllustration() {
  return (
    <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-3xl border border-[#CBD5E1]/60 bg-[#E2ECFF]/40">
      <Rocket
        size={22}
        className="absolute left-5 top-5 text-[#0046AD]/50"
        strokeWidth={1.5}
      />
      <Compass size={40} className="text-[#0046AD]/70" strokeWidth={1.5} />
      <LayoutGrid
        size={20}
        className="absolute bottom-5 left-5 text-[#0046AD]/50"
        strokeWidth={1.5}
      />
      <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-[#CBD5E1] bg-[#F4F7FF] text-[#0046AD]/50">
        <Plus size={18} strokeWidth={2} />
      </div>
    </div>
  );
}

const EMPTY_FEATURE_CARDS = [
  {
    icon: Sparkles,
    title: 'High-Level Goals',
    description: 'Define the broad objectives that span across multiple cycles.',
  },
  {
    icon: GitBranch,
    title: 'Hierarchy Design',
    description: 'Link individual tasks to parent epics for a consolidated view.',
  },
  {
    icon: LineChart,
    title: 'Track Velocity',
    description: 'Visualize percentage completion at a macro project level.',
  },
] as const;

function EmptyEpicsState({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <EmptyEpicsIllustration />
      <h2 className="text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">
        No epics in this project yet.
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#4A5568] sm:text-base">
        Break down your large project into manageable epics to track progress better and maintain
        architectural clarity.
      </p>
      <Link
        href={getProjectEpicsNewHref(projectId)}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#0046AD] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#0056D2]"
      >
        <Zap size={16} className="shrink-0" />
        Create First Epic
      </Link>

      <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
        {EMPTY_FEATURE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-xl border border-[#CBD5E1]/60 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#E2ECFF] text-[#0046AD]">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold text-[#0A192F]">{card.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#4A5568]">{card.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssigneeCell({ user }: { user?: EpicUser | null }) {
  if (!user?.name) {
    return <span className="text-sm text-[#4A5568]">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E2ECFF] text-[10px] font-bold text-[#0046AD]">
        {getAvatarLetters(user.name)}
      </div>
      <span className="truncate text-sm font-medium text-[#0A192F]">{user.name}</span>
    </div>
  );
}

function EpicRow({ epic }: { epic: Epic }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-[#CBD5E1]/60 px-4 py-4 last:border-b-0 sm:grid-cols-[100px_1fr_160px_140px_120px] sm:items-center sm:gap-4 sm:px-6">
      <div>
        <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase sm:hidden">
          Epic ID
        </span>
        <p className="text-xs font-bold text-[#0046AD]">{epic.epic_id}</p>
      </div>

      <div className="min-w-0">
        <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase sm:hidden">
          Epic
        </span>
        <p className="truncate text-sm font-bold text-[#0A192F]">{epic.title}</p>
      </div>

      <div className="min-w-0">
        <span className="mb-1 block text-[10px] font-bold tracking-wider text-[#4A5568] uppercase sm:hidden">
          Assignee
        </span>
        <AssigneeCell user={epic.assignee} />
      </div>

      <div className="min-w-0">
        <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase sm:hidden">
          Created By
        </span>
        <p className="truncate text-sm text-[#4A5568]">{epic.created_by?.name || '—'}</p>
      </div>

      <div>
        <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase sm:hidden">
          Created
        </span>
        <p className="text-sm text-[#4A5568]">{formatCreatedDate(epic.created_at)}</p>
      </div>
    </div>
  );
}

function EpicsPaginationUi({ totalCount }: { totalCount: number }) {
  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-[#CBD5E1]/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-[#4A5568]">
        Showing 1-{totalCount} of {totalCount} epics
      </p>
      <div className="flex items-center gap-1" aria-hidden>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#CBD5E1]">
          <ChevronLeft size={16} />
        </span>
        <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#0046AD] px-2 text-xs font-bold text-white">
          1
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#CBD5E1]">
          <ChevronRight size={16} />
        </span>
      </div>
    </div>
  );
}

export default function ProjectEpicsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [epics, setEpics] = useState<Epic[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchEpics = async () => {
      setPageState('loading');

      try {
        const response = await fetch(supabaseRestUrl(`/project_epics?project_id=eq.${id}`), {
          method: 'GET',
          headers: supabaseAuthHeaders(token),
        });

        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        if (!response.ok) {
          setPageState('error');
          return;
        }

        const data: Epic[] = await response.json();
        setEpics(data);
        setPageState(data.length === 0 ? 'empty' : 'success');
      } catch {
        setPageState('error');
      }
    };

    fetchEpics();
  }, [id, router]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {pageState === 'loading' ? (
        <EpicsLoadingState />
      ) : (
        <>
          <ProjectBreadcrumb
            items={[
              { label: 'Projects', href: '/project' },
              { label: 'Project' },
              { label: 'Epics', active: true },
            ]}
          />

          <h1 className="mb-6 text-2xl font-bold tracking-tight text-[#0A192F] sm:text-3xl">
            Project Epics
          </h1>
        </>
      )}

      {pageState === 'error' && (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-[#CBD5E1] bg-white px-4 py-16 text-center shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#D31818]">
            <CloudOff size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#0A192F] sm:text-2xl">
            Failed to load epics
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4A5568]">
            We&apos;re having trouble retrieving epics right now. Please try again in a moment.
          </p>
        </div>
      )}

      {pageState === 'empty' && <EmptyEpicsState projectId={id} />}

      {pageState === 'success' && (
        <>
          <div className="overflow-hidden rounded-xl border border-[#CBD5E1] bg-white shadow-sm">
            <div className="hidden border-b border-[#CBD5E1]/60 px-6 py-3 sm:grid sm:grid-cols-[100px_1fr_160px_140px_120px] sm:gap-4">
              <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
                Epic ID
              </span>
              <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
                Epic
              </span>
              <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
                Assignee
              </span>
              <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
                Created By
              </span>
              <span className="text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
                Created
              </span>
            </div>

            {epics.map((epic) => (
              <EpicRow key={epic.id} epic={epic} />
            ))}
          </div>

          <EpicsPaginationUi totalCount={epics.length} />
        </>
      )}
    </div>
  );
}
