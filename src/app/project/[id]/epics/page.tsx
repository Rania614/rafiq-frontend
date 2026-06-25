'use client';

import { use, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudOff,
  Database,
  GitBranch,
  LineChart,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import ProjectBreadcrumb from '@/app/components/ProjectBreadcrumb';
import { getAvatarLetters } from '@/utils/avatar';
import { getAccessToken } from '@/utils/auth';
import { getProjectEpicsNewHref } from '@/utils/project';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';
import {
  EPICS_PAGE_SIZE,
  getPageNumbers,
  getTotalPages,
  parseContentRange,
} from '@/utils/pagination';

interface EpicUser {
  name?: string;
}

interface Epic {
  id: string;
  epic_id: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  created_at: string;
  created_by?: EpicUser | null;
  assignee?: EpicUser | null;
  assignee_id?: string | null;
}

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

function getDatePickerValue(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

type PageState = 'loading' | 'success' | 'error' | 'empty';

const MOBILE_QUERY = '(max-width: 767px)';

const SHADOW_SM = 'shadow-[0_1px_2px_0px_#0000000d]';

const GRADIENT_BUTTON_BASE = `inline-flex items-center justify-center rounded-sm bg-gradient-to-br from-[#003D9B] to-[#0052CC] text-white ${SHADOW_SM}`;

const NEW_EPIC_BUTTON_CLASS = `${GRADIENT_BUTTON_BASE} gap-2 px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-95`;

const SHOWING_TEXT_CLASS = 'text-sm font-medium text-[#434654]';

const PAGINATION_BUTTON_CLASS =
  'flex size-9 items-center justify-center rounded-xs border border-[#C3C6D6] text-sm font-bold text-[#434654] transition-colors hover:bg-[#F1F3FF] disabled:cursor-not-allowed disabled:opacity-40';

const EPIC_ACTION_BUTTON_CLASS =
  'rounded-sm p-1 text-[#041B3C]/20 transition-colors hover:text-[#041B3C]/40';

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '---';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function EpicCardSkeletonDesktop() {
  return (
    <div
      className={`hidden animate-pulse flex-col gap-4 rounded-lg border-s-4 border-s-[#004E32] bg-white p-4 lg:flex lg:justify-between ${SHADOW_SM}`}
    >
      <header className="flex items-center justify-between">
        <div className="h-6 w-16 rounded-sm bg-[#E8EDFF]" />
        <div className="size-6 rounded-sm bg-[#F1F3FF]" />
      </header>
      <div className="flex flex-col gap-3">
        <div className="h-7 w-3/4 rounded-sm bg-[#E8EDFF]" />
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-[#E8EDFF]" />
          <div className="flex flex-col gap-1">
            <div className="h-4 w-12 rounded-sm bg-[#E8EDFF]" />
            <div className="h-5 w-24 rounded-sm bg-[#E8EDFF]" />
          </div>
        </div>
      </div>
      <footer className="mt-auto flex items-end justify-between border-t border-[#F1F3FF] pt-4">
        <div className="h-4 w-28 rounded-sm bg-[#E8EDFF]" />
        <div className="h-4 w-20 rounded-sm bg-[#E8EDFF]" />
      </footer>
    </div>
  );
}

function EpicCardSkeletonMobile() {
  return (
    <div
      className={`flex min-h-48 animate-pulse flex-col gap-4 rounded-lg bg-white p-4 lg:hidden ${SHADOW_SM}`}
    >
      <header className="flex items-center justify-between">
        <div className="h-6 w-16 rounded-sm bg-[#E8EDFF]" />
        <div className="size-6 rounded-sm bg-[#F1F3FF]" />
      </header>
      <div className="flex h-full flex-col justify-between gap-3">
        <div className="h-7 w-full rounded-sm bg-[#E8EDFF]" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-lg bg-[#E8EDFF]" />
            <div className="flex flex-col gap-1">
              <div className="h-4 w-24 rounded-sm bg-[#E8EDFF]" />
              <div className="h-3 w-12 rounded-sm bg-[#F1F3FF]" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="h-3 w-12 rounded-sm bg-[#F1F3FF]" />
            <div className="h-4 w-16 rounded-sm bg-[#E8EDFF]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EpicsLoadingState() {
  return (
    <section className="flex flex-col gap-6">
      <header className="mb-5 flex animate-pulse flex-col gap-4 lg:mb-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="h-10 w-48 max-w-full rounded-md bg-[#E8EDFF]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-9">
          <div className="h-12 w-full rounded-sm bg-[#E8EDFF] lg:w-56" />
          <div className="hidden h-10 w-32 rounded-sm bg-[#E8EDFF] lg:block" />
        </div>
      </header>
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <EpicCardSkeletonDesktop />
            <EpicCardSkeletonMobile />
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyEpicsIllustration() {
  return (
    <div className="relative mx-auto mb-2 flex size-48 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-[#F1F3FF]/80 blur-2xl" />
      <div className="relative flex size-36 items-center justify-center rounded-2xl bg-[#F1F3FF] text-[#0052CC]">
        <GitBranch size={48} strokeWidth={1.25} />
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
    <section className="flex items-center justify-center sm:mx-auto sm:max-w-3/4 lg:min-h-[80vh] xl:max-w-2/3">
      <div>
        <div className="mb-20 flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <EmptyEpicsIllustration />
            <h2 className="text-center text-[28px] font-semibold tracking-[-0.75px] text-[#041B3C] lg:text-[36px] lg:tracking-[-0.9px]">
              No epics in this project yet.
            </h2>
            <p className="mx-auto max-w-2/3 text-center text-sm leading-6 tracking-[0.6px] text-[#434654]">
              Break down your large project into manageable epics to track progress better and
              maintain architectural clarity.
            </p>
          </div>
          <Link href={getProjectEpicsNewHref(projectId)} className={NEW_EPIC_BUTTON_CLASS}>
            <Zap size={16} />
            Create First Epic
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {EMPTY_FEATURE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="flex flex-col gap-3 rounded-lg bg-[#F1F3FF] p-5">
                <div className="flex size-10 items-center justify-center rounded-sm bg-white text-[#003D9B]">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold text-[#041B3C]">{card.title}</h3>
                  <p className="text-sm text-[#434654]">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EpicSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex w-full items-center lg:max-w-xs">
      <Search className="pointer-events-none absolute left-3 size-4 text-[#737685]" />
      <input
        type="search"
        placeholder="search epic..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-sm border-0 bg-[#E0E8FF] py-3 pr-4 pl-10 text-sm text-[#434654] placeholder:text-[#737685]/70 transition-colors focus:outline focus:outline-1 focus:outline-[#003D9B]"
      />
    </div>
  );
}

function SearchEmptyState() {
  return (
    <section className="flex items-center justify-center sm:mx-auto sm:max-w-3/4 lg:min-h-[50vh] xl:max-w-2/3">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-24 items-center justify-center rounded-2xl bg-[#F1F3FF] text-[#0052CC]">
          <Search size={40} strokeWidth={1.25} />
        </div>
        <h2 className="text-2xl font-semibold tracking-[-0.75px] text-[#041B3C]">
          No epics found matching your search
        </h2>
      </div>
    </section>
  );
}

function EpicsErrorState({ onRetry }: { onRetry: () => void }) {
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
            We&apos;re having trouble retrieving epics right now. Please try again in a moment.
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

function EpicCard({ epic, onClick }: { epic: Epic; onClick: () => void }) {
  const assigneeInitials = epic.assignee?.name ? getAvatarLetters(epic.assignee.name) : 'NA';
  const assigneeName = epic.assignee?.name ?? '---';
  const deadlineLabel = formatDisplayDate(epic.deadline);
  const createdByName = epic.created_by?.name ?? '---';

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer text-left"
    >
      <div
        className={`hidden flex-col gap-4 rounded-lg border-s-4 border-s-[#004E32] bg-white p-4 lg:flex lg:justify-between ${SHADOW_SM}`}
      >
        <header className="flex items-center justify-between">
          <span className="inline-flex rounded-sm bg-[#82F9BE] px-2.5 py-1 text-[10px] font-bold uppercase text-[#005235]">
            {epic.epic_id}
          </span>
          <button
            type="button"
            className={EPIC_ACTION_BUTTON_CLASS}
            aria-label="Epic actions"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical size={16} />
          </button>
        </header>

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-[#041B3C]">{epic.title}</h2>
          <div className="flex gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#65DCA4] text-xs font-bold text-[#002113]">
              {assigneeInitials}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#434654]">Assignee</span>
              <span className="font-semibold capitalize text-[#041B3C]">{assigneeName}</span>
            </div>
          </div>
        </div>

        <footer className="mt-auto flex items-end justify-between border-t border-[#F1F3FF] pt-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="text-[#434654]/80">Created by:</span>
            <span className="capitalize text-[#041B3C]">{createdByName}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#434654]/80">
            <Calendar size={12} className="shrink-0" />
            <span>{deadlineLabel}</span>
          </div>
        </footer>
      </div>

      <div
        className={`flex min-h-48 flex-col gap-4 rounded-lg bg-white p-4 lg:hidden ${SHADOW_SM}`}
      >
        <header className="flex items-center justify-between">
          <span className="inline-flex rounded-sm bg-[#DAE2FF] px-2.5 py-1 text-[10px] font-bold uppercase text-[#003D9B]">
            {epic.epic_id}
          </span>
          <button
            type="button"
            className={`${EPIC_ACTION_BUTTON_CLASS} rotate-90`}
            aria-label="Epic actions"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical size={16} />
          </button>
        </header>

        <div className="flex h-full flex-col justify-between gap-3">
          <h2 className="text-xl font-semibold text-[#041B3C]">{epic.title}</h2>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#003D9B] text-[10px] font-bold text-white">
                {assigneeInitials}
              </div>
              <div className="flex flex-col">
                <span className="font-medium capitalize text-[#041B3C]">{assigneeName}</span>
                <span className="text-[10px] text-[#737685]">Assignee</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase text-[#737685]">deadline</span>
              <span className="text-sm font-semibold text-[#434654]/80">{deadlineLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EpicDetailsModalProps {
  epicId: string;
  projectId: string;
  onClose: () => void;
  onUpdate?: (updated: Epic) => void;
}

/**
 * A modal details popup displaying single epic information and a checklist dummy view.
 */
function EpicDetailsModal({ epicId, projectId, onClose, onUpdate }: EpicDetailsModalProps) {
  const router = useRouter();
  const [epic, setEpic] = useState<Epic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Members lists
  const [members, setMembers] = useState<ProjectMember[]>([]);

  // Inline editing states
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');

  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchEpicDetailsAndMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const epicUrl = supabaseRestUrl(
          `/project_epics?project_id=eq.${projectId}&id=eq.${epicId}`
        );
        const membersUrl = supabaseRestUrl(`/get_project_members?project_id=eq.${projectId}`);

        const [epicRes, membersRes] = await Promise.all([
          fetch(epicUrl, { method: 'GET', headers: supabaseAuthHeaders(token) }),
          fetch(membersUrl, { method: 'GET', headers: supabaseAuthHeaders(token) }),
        ]);

        if (epicRes.status === 401 || membersRes.status === 401) {
          router.replace('/login');
          return;
        }

        if (!epicRes.ok) {
          setError('Failed to load epic details');
          return;
        }

        const epicData: Epic[] = await epicRes.json();
        if (epicData.length > 0) {
          const fetchedEpic = epicData[0];
          setEpic(fetchedEpic);
          setTempTitle(fetchedEpic.title);
          setTempDescription(fetchedEpic.description ?? '');
        } else {
          setError('Epic not found');
        }

        if (membersRes.ok) {
          const membersData: Record<string, unknown>[] = await membersRes.json();
          setMembers(membersData.map(normalizeMember).filter((member) => member.id));
        }
      } catch {
        setError('Failed to load epic details');
      } finally {
        setLoading(false);
      }
    };

    fetchEpicDetailsAndMembers();
  }, [epicId, projectId, router]);

  // Prevent background scroll when the details modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle click outside assignee dropdown
  useEffect(() => {
    if (!isEditingAssignee) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditingAssignee(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingAssignee]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Format date nicely (e.g. Dec 25, 2025)
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSaveField = async (
    field: 'title' | 'description' | 'assignee_id' | 'deadline',
    value: string | null
  ) => {
    if (!epic) return;

    let hasChanged = false;
    if (field === 'title') {
      hasChanged = (value ?? '').trim() !== epic.title;
    } else if (field === 'description') {
      hasChanged = (value || null) !== (epic.description || null);
    } else if (field === 'assignee_id') {
      const currentAssigneeName = epic.assignee?.name || null;
      const currentAssigneeMember = members.find((m) => m.name === currentAssigneeName);
      const currentAssigneeId = currentAssigneeMember?.id || null;
      hasChanged = (value || null) !== currentAssigneeId;
    } else if (field === 'deadline') {
      hasChanged = (value || null) !== (epic.deadline || null);
    }

    if (!hasChanged) {
      if (field === 'title') setIsEditingTitle(false);
      if (field === 'description') setIsEditingDescription(false);
      if (field === 'assignee_id') setIsEditingAssignee(false);
      if (field === 'deadline') setIsEditingDeadline(false);
      return;
    }

    if (field === 'title' && !(value ?? '').trim()) {
      setToast({ message: 'Title is required.', type: 'error' });
      setTempTitle(epic.title);
      setIsEditingTitle(false);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setIsSaving(true);
    setToast(null);

    try {
      const url = supabaseRestUrl(`/epics?id=eq.${epicId}`);
      const payload: Record<string, string | null> = {};
      if (field === 'title') payload.title = (value ?? '').trim();
      if (field === 'description') payload.description = value ? value.trim() : null;
      if (field === 'assignee_id') payload.assignee_id = value || null;
      if (field === 'deadline') payload.deadline = value || null;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: supabaseAuthHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('PATCH failed');
      }

      const updatedEpic = { ...epic };
      if (field === 'title') {
        updatedEpic.title = (value ?? '').trim();
      }
      if (field === 'description') {
        updatedEpic.description = value ? value.trim() : null;
      }
      if (field === 'assignee_id') {
        if (value) {
          const selectedMember = members.find((m) => m.id === value);
          updatedEpic.assignee = selectedMember ? { name: selectedMember.name } : null;
          updatedEpic.assignee_id = value;
        } else {
          updatedEpic.assignee = null;
          updatedEpic.assignee_id = null;
        }
      }
      if (field === 'deadline') {
        updatedEpic.deadline = value || null;
      }

      setEpic(updatedEpic);
      setToast({ message: 'Epic updated successfully', type: 'success' });
      onUpdate?.(updatedEpic);

      if (field === 'title') setIsEditingTitle(false);
      if (field === 'description') setIsEditingDescription(false);
      if (field === 'assignee_id') setIsEditingAssignee(false);
      if (field === 'deadline') setIsEditingDeadline(false);
    } catch {
      if (field === 'title') setTempTitle(epic.title);
      if (field === 'description') setTempDescription(epic.description || '');

      setToast({ message: 'Failed to update epic. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#041B3C]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {toast && (
        <div
          role="status"
          className={`fixed top-20 right-4 left-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-sm border bg-white px-4 py-3 ${SHADOW_SM} sm:right-6 sm:left-auto ${
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

      <div
        className={`relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-sm bg-white ${SHADOW_SM}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-sm p-1 text-[#434654] transition-colors hover:bg-[#F1F3FF]"
          aria-label="Close details"
        >
          <X size={16} />
        </button>

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#003D9B]" />
            <p className="mt-2 text-sm text-[#434654]">Loading details...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#FFDBD6] text-[#BA1A1A]">
              <CloudOff size={24} />
            </div>
            <h3 className="text-lg font-semibold text-[#041B3C]">{error}</h3>
            <button
              type="button"
              onClick={onClose}
              className={`${GRADIENT_BUTTON_BASE} mt-6 px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-95`}
            >
              Close
            </button>
          </div>
        ) : epic ? (
          <div className="flex flex-col overflow-y-auto p-6 sm:p-8">
            {/* Header: Epic Code/ID with Database Icon */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#003D9B]">
              <Database size={14} className="shrink-0" />
              <span>{epic.epic_id}</span>
            </div>

            {/* Epic Title */}
            {isEditingTitle ? (
              <input
                type="text"
                value={tempTitle}
                disabled={isSaving}
                autoFocus
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => handleSaveField('title', tempTitle)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    setTempTitle(epic.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="mt-2 w-full rounded-lg border border-[#E8EDFF] bg-white px-3 py-2 text-xl font-bold text-[#041B3C] focus:border-[#003D9B] focus:outline-none focus:ring-1 focus:ring-[#003D9B] disabled:bg-gray-50 disabled:text-gray-500"
              />
            ) : (
              <h2
                onClick={() => {
                  if (!isSaving) {
                    setTempTitle(epic.title);
                    setIsEditingTitle(true);
                  }
                }}
                className="mt-2 cursor-pointer rounded-lg border border-transparent px-2 py-1 text-xl font-bold tracking-tight text-[#041B3C] hover:border-[#E8EDFF] hover:bg-[#F1F3FF]/30 sm:text-2xl transition-colors"
              >
                {epic.title}
              </h2>
            )}

            {/* Epic Description */}
            {isEditingDescription ? (
              <textarea
                value={tempDescription}
                disabled={isSaving}
                autoFocus
                rows={4}
                onChange={(e) => setTempDescription(e.target.value)}
                onBlur={() => handleSaveField('description', tempDescription)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    setTempDescription(epic.description || '');
                    setIsEditingDescription(false);
                  }
                }}
                className="mt-4 w-full resize-y rounded-lg border border-[#E8EDFF] bg-white px-3 py-2 text-sm text-[#434654] focus:border-[#003D9B] focus:outline-none focus:ring-1 focus:ring-[#003D9B] disabled:bg-gray-50 disabled:text-gray-500"
              />
            ) : (
              <p
                onClick={() => {
                  if (!isSaving) {
                    setTempDescription(epic.description || '');
                    setIsEditingDescription(true);
                  }
                }}
                className="mt-4 cursor-pointer rounded-lg border border-transparent px-2 py-1.5 text-sm leading-relaxed text-[#434654] hover:border-[#E8EDFF] hover:bg-[#F1F3FF]/30 transition-colors whitespace-pre-wrap min-h-[2.5rem]"
              >
                {epic.description || 'No description provided'}
              </p>
            )}

            {/* Meta Grid: 3 Columns */}
            <div className="mt-6 grid grid-cols-1 gap-6 border-t border-b border-[#E8EDFF]/60 py-5 sm:grid-cols-3">
              {/* Creator Column */}
              <div>
                <span className="block text-[10px] font-bold tracking-wider text-[#434654] uppercase">
                  Created By
                </span>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E0E8FF] text-[10px] font-bold text-[#003D9B]">
                    {getAvatarLetters(epic.created_by?.name || 'Unknown')}
                  </div>
                  <span className="truncate text-sm font-semibold text-[#041B3C]">
                    {epic.created_by?.name || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Assignee Column */}
              <div className="relative" ref={assigneeDropdownRef}>
                <span className="block text-[10px] font-bold tracking-wider text-[#434654] uppercase">
                  Assignee
                </span>

                {isEditingAssignee ? (
                  <div className="relative mt-2.5">
                    <button
                      type="button"
                      disabled={isSaving}
                      className="flex w-full items-center gap-2 rounded-lg border border-[#003D9B] bg-[#F1F3FF] px-2 py-1 text-left text-sm text-[#041B3C] focus:outline-none"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8EDFF] text-[10px] font-bold text-[#434654]">
                        {getAvatarLetters(epic.assignee?.name || 'Unassigned')}
                      </div>
                      <span className="truncate text-sm font-semibold">
                        {epic.assignee?.name || 'Unassigned'}
                      </span>
                    </button>

                    <div className="absolute left-0 mt-1 z-[100] w-64 rounded-xl border border-[#E8EDFF] bg-white p-1 shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => handleSaveField('assignee_id', null)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F1F3FF] transition-colors"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500">
                          —
                        </div>
                        <span className="font-medium text-[#434654]">Unassigned</span>
                      </button>

                      {members.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSaveField('assignee_id', member.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F1F3FF] transition-colors"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#E0E8FF] text-[10px] font-bold text-[#003D9B]">
                            {getAvatarLetters(member.name)}
                          </div>
                          <span className="truncate font-medium text-[#041B3C]">{member.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (!isSaving) {
                        setIsEditingAssignee(true);
                      }
                    }}
                    className="mt-2.5 flex cursor-pointer items-center gap-2 rounded-lg border border-transparent p-1 transition-colors hover:border-[#E8EDFF] hover:bg-[#F1F3FF]/30"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E0E8FF] text-[10px] font-bold text-[#003D9B]">
                      {getAvatarLetters(epic.assignee?.name || 'Unassigned')}
                    </div>
                    <span className="truncate text-sm font-semibold text-[#041B3C]">
                      {epic.assignee?.name || 'Unassigned'}
                    </span>
                  </div>
                )}
              </div>

              {/* Deadline Column */}
              <div>
                <span className="block text-[10px] font-bold tracking-wider text-[#434654] uppercase">
                  Deadline
                </span>

                {isEditingDeadline ? (
                  <input
                    type="date"
                    value={getDatePickerValue(epic.deadline)}
                    disabled={isSaving}
                    autoFocus
                    onChange={(e) => handleSaveField('deadline', e.target.value)}
                    onBlur={() => setIsEditingDeadline(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsEditingDeadline(false);
                      }
                    }}
                    className="mt-2.5 w-full rounded-lg border border-[#E8EDFF] bg-white px-2 py-1 text-sm text-[#041B3C] focus:border-[#003D9B] focus:outline-none"
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (!isSaving) {
                        setIsEditingDeadline(true);
                      }
                    }}
                    className="mt-2.5 flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent p-1 text-sm font-semibold text-[#041B3C] transition-colors hover:border-[#E8EDFF] hover:bg-[#F1F3FF]/30"
                  >
                    <Calendar size={15} className="shrink-0 text-[#434654]" />
                    <span>{formatDate(epic.deadline)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Created At Detail */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-[#434654]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Created At:</span>
              <Calendar size={13} className="shrink-0" />
              <span>{formatDate(epic.created_at)}</span>
            </div>

            {/* Epic Tasks Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#041B3C]">Tasks</h3>
                <button
                  type="button"
                  onClick={() => router.push(`/project/${projectId}/tasks/new?epic_id=${epic.id}`)}
                  className="flex items-center gap-1 text-xs font-bold text-[#003D9B] hover:underline"
                >
                  + Add Task
                </button>
              </div>

              {/* Tasks Empty State Container */}
              <div className="mt-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8EDFF] bg-[#F1F3FF]/30 p-8 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#E0E8FF] text-[#003D9B]">
                  <ClipboardList size={20} />
                </div>
                <p className="text-xs font-medium text-[#434654]">
                  No tasks have been added to this epic yet
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/project/${projectId}/tasks/new?epic_id=${epic.id}`)}
                  className="mt-4 rounded-lg bg-[#003D9B] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2]"
                >
                  + Add Task
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ProjectEpicsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrapping the route params to get the project ID
  const { id } = use(params);
  const router = useRouter();

  // Reference for the hidden 'sentinel' element at the bottom of the list for infinite scrolling
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // A ref to keep track of loading state synchronously inside event handlers & observers
  const isLoadingMoreRef = useRef(false);

  // States to manage our page loading/empty/error states
  const [pageState, setPageState] = useState<PageState>('loading');
  const [epics, setEpics] = useState<Epic[]>([]);

  // State to manage the active/selected epic for the details popup
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State management for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calculate total pages needed using Math.ceil(totalCount / EPICS_PAGE_SIZE)
  const totalPages = getTotalPages(totalCount, EPICS_PAGE_SIZE);
  const hasMoreMobile = epics.length < totalCount;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredEpics = normalizedSearch
    ? epics.filter(
        (epic) =>
          epic.title.toLowerCase().includes(normalizedSearch) ||
          epic.epic_id.toLowerCase().includes(normalizedSearch)
      )
    : epics;

  // Track the last project ID we fetched, to detect when it changes
  const lastProjectIdRef = useRef(id);

  /**
   * Main function to fetch project epics from the Supabase API.
   * Supports both regular paging (replacing records) and infinite scrolling (appending records).
   */
  const fetchEpics = useCallback(
    async ({ offset, append = false }: { offset: number; append?: boolean }) => {
      const token = getAccessToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      if (append) {
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
      } else {
        setPageState('loading');
      }

      try {
        // Construct the URL with required filter, limit, and offset parameters
        const url = supabaseRestUrl(
          `/project_epics?project_id=eq.${id}&limit=${EPICS_PAGE_SIZE}&offset=${offset}`
        );

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            ...supabaseAuthHeaders(token),
            Prefer: 'count=exact', // CRITICAL: This asks the server to compute the exact total records count
          },
        });

        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        if (!response.ok) {
          setPageState('error');
          return;
        }

        // Parse pagination headers (Content-Range: 0-9/50)
        const { start, end, total } = parseContentRange(response.headers.get('content-range'));
        const data: Epic[] = await response.json();

        setTotalCount(total);
        setRangeStart(start);
        setRangeEnd(end);

        // If 'append' is true (mobile scroll), merge new data; otherwise, replace it (desktop pagination)
        setEpics((prev) => (append ? [...prev, ...data] : data));

        // Determine page state: empty if total records is 0, success otherwise
        setPageState(total === 0 ? 'empty' : 'success');
      } catch {
        setPageState('error');
      } finally {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    },
    [id, router]
  );

  /**
   * Track the window size dynamically using matchesMedia,
   * to toggle between Desktop (paginated buttons) and Mobile (infinite scroll).
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const updateIsMobile = () => {
      const matches = mediaQuery.matches;
      setIsMobile((wasMobile) => {
        if (matches !== wasMobile) {
          setCurrentPage(1);
          setEpics([]);
        }
        return matches;
      });
    };

    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);
    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  /**
   * Fetch logic handler. Runs on component mount, or when current page, screen size,
   * or fetch callback changes (e.g. project ID changes).
   */
  useEffect(() => {
    // If project ID has changed, reset the pagination to page 1 and clear the list
    if (lastProjectIdRef.current !== id) {
      lastProjectIdRef.current = id;
      setCurrentPage(1);
      setEpics([]);

      fetchEpics({ offset: 0, append: false });
      return;
    }

    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preserve existing epics fetch flow
      fetchEpics({ offset: 0, append: false });
      return;
    }

    // Desktop: fetch the exact slice of records for the active page

    fetchEpics({
      offset: (currentPage - 1) * EPICS_PAGE_SIZE,
      append: false,
    });
  }, [currentPage, isMobile, id, fetchEpics]);

  /**
   * Setup an IntersectionObserver at the bottom of the list for mobile screens.
   * Fetches the next page of epics as soon as the sentinel element is scrolled into view.
   */
  useEffect(() => {
    if (!isMobile || pageState !== 'success' || !hasMoreMobile) return;

    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // If the bottom sentinel is visible and we're not already loading
        if (entries[0]?.isIntersecting && !isLoadingMoreRef.current) {
          fetchEpics({ offset: epics.length, append: true });
        }
      },
      { rootMargin: '120px' } // Load a bit early before the user reaches the absolute bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isMobile, pageState, hasMoreMobile, epics.length, fetchEpics]);

  // Handler for page clicks in Desktop mode
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers array for pagination bar (e.g. [1, 2, ..., totalPages])
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  // Format the helper text showing the pagination boundaries
  const showingText = normalizedSearch
    ? `Showing ${filteredEpics.length} of ${totalCount} active epics`
    : isMobile
      ? `Showing ${epics.length} of ${totalCount} active epics`
      : `Showing ${rangeStart + 1}-${rangeEnd + 1} of ${totalCount} active epics`;

  const handleRetry = () => {
    if (isMobile) {
      fetchEpics({ offset: 0, append: false });
      return;
    }

    fetchEpics({
      offset: (currentPage - 1) * EPICS_PAGE_SIZE,
      append: false,
    });
  };

  const showEpicsGrid = pageState === 'success' && (!normalizedSearch || filteredEpics.length > 0);
  const showSearchEmpty = pageState === 'success' && normalizedSearch && filteredEpics.length === 0;

  return (
    <section className="flex min-h-screen flex-col">
      {pageState === 'loading' ? (
        <>
          <ProjectBreadcrumb
            items={[
              { label: 'Projects', href: '/project' },
              { label: 'Project' },
              { label: 'Epics', active: true },
            ]}
          />
          <EpicsLoadingState />
        </>
      ) : (
        <>
          <ProjectBreadcrumb
            items={[
              { label: 'Projects', href: '/project' },
              { label: 'Project' },
              { label: 'Epics', active: true },
            ]}
          />

          {pageState !== 'empty' && (
            <header className="mb-5 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-center lg:justify-between">
              <h1 className="w-full flex-1 text-[30px] font-semibold capitalize leading-9 tracking-[-0.75px] text-[#041B3C] lg:text-[36px] lg:leading-10 lg:tracking-[-0.9px]">
                project epics
              </h1>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-9">
                <EpicSearchInput value={searchTerm} onChange={setSearchTerm} />
                <Link
                  href={getProjectEpicsNewHref(id)}
                  className={`${NEW_EPIC_BUTTON_CLASS} hidden lg:inline-flex`}
                >
                  <Plus size={16} />
                  new epic
                </Link>
              </div>
            </header>
          )}

          {pageState === 'error' && <EpicsErrorState onRetry={handleRetry} />}

          {pageState === 'empty' && <EmptyEpicsState projectId={id} />}

          {showSearchEmpty && <SearchEmptyState />}

          {showEpicsGrid && (
            <>
              <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
                {filteredEpics.map((epic) => (
                  <EpicCard key={epic.id} epic={epic} onClick={() => setSelectedEpicId(epic.id)} />
                ))}
              </div>

              {isMobile && isLoadingMore && (
                <div className="mb-6 flex items-center justify-center gap-2 text-sm text-[#434654]">
                  <Loader2 size={18} className="animate-spin text-[#003D9B]" />
                  Loading more epics...
                </div>
              )}

              {isMobile && hasMoreMobile && !normalizedSearch && (
                <div ref={loadMoreRef} className="h-4" aria-hidden />
              )}

              <footer className="hidden flex-col items-center justify-center gap-6 lg:flex lg:flex-row lg:justify-between">
                <p className={SHOWING_TEXT_CLASS}>{showingText}</p>
                {!isMobile && !normalizedSearch && totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={PAGINATION_BUTTON_CLASS}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {pageNumbers.map((page, index) => {
                      const prevPage = pageNumbers[index - 1];
                      const showEllipsis = prevPage !== undefined && page - prevPage > 1;

                      return (
                        <span key={page} className="flex items-center gap-2">
                          {showEllipsis && (
                            <span className="flex size-9 items-center justify-center text-sm font-bold text-[#434654]">
                              ...
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePageChange(page)}
                            className={`${PAGINATION_BUTTON_CLASS} ${
                              page === currentPage ? 'border-[#003D9B] bg-[#003D9B] text-white' : ''
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className={PAGINATION_BUTTON_CLASS}
                      aria-label="Next page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </footer>

              {isMobile && totalCount > 0 && (
                <p className={`${SHOWING_TEXT_CLASS} mb-6 text-center`}>{showingText}</p>
              )}
            </>
          )}

          {pageState === 'success' && (
            <Link
              href={getProjectEpicsNewHref(id)}
              className={`fixed bottom-20 right-6 z-40 flex size-14 items-center justify-center rounded-full ${GRADIENT_BUTTON_BASE} transition-opacity hover:opacity-95 lg:hidden`}
              aria-label="Create new epic"
            >
              <Plus size={22} />
            </Link>
          )}
        </>
      )}

      {selectedEpicId && (
        <EpicDetailsModal
          epicId={selectedEpicId}
          projectId={id}
          onClose={() => setSelectedEpicId(null)}
          onUpdate={(updatedEpic) => {
            setEpics((prev) =>
              prev.map((e) => (e.id === updatedEpic.id ? { ...e, ...updatedEpic } : e))
            );
          }}
        />
      )}
    </section>
  );
}
