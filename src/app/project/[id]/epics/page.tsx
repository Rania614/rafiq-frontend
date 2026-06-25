'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
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
  Compass,
  Database,
  GitBranch,
  LayoutGrid,
  LineChart,
  ListTodo,
  Loader2,
  Plus,
  Rocket,
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
      <Rocket size={22} className="absolute left-5 top-5 text-[#0046AD]/50" strokeWidth={1.5} />
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
        No epics found for this project
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

function EpicRow({ epic, onClick }: { epic: Epic; onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="grid cursor-pointer grid-cols-1 gap-3 border-b border-[#CBD5E1]/60 px-4 py-4 last:border-b-0 hover:bg-[#F4F7FF]/50 transition-colors sm:grid-cols-[100px_1fr_160px_140px_120px] sm:items-center sm:gap-4 sm:px-6"
    >
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {toast && (
        <div
          role="status"
          className={`fixed top-20 right-4 left-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg sm:right-6 sm:left-auto ${
            toast.type === 'success' ? 'border-[#70FFB5]/40' : 'border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-[#0046AD]" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-[#D31818]" />
          )}
          <p className="flex-1 text-sm font-semibold text-[#0A192F]">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="rounded-lg p-1 text-[#4A5568] hover:bg-[#F4F7FF]"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#CBD5E1] bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#4A5568] transition-colors hover:border-[#0046AD] hover:bg-[#F4F7FF] hover:text-[#0046AD]"
          aria-label="Close details"
        >
          <X size={16} />
        </button>

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0046AD]" />
            <p className="mt-2 text-sm text-[#4A5568]">Loading details...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center py-12 px-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#D31818]">
              <CloudOff size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#0A192F]">{error}</h3>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-lg bg-[#0046AD] px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2]"
            >
              Close
            </button>
          </div>
        ) : epic ? (
          <div className="flex flex-col overflow-y-auto p-6 sm:p-8">
            {/* Header: Epic Code/ID with Database Icon */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0046AD]">
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
                className="mt-2 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xl font-bold text-[#0A192F] focus:border-[#0046AD] focus:outline-none focus:ring-1 focus:ring-[#0046AD] disabled:bg-gray-50 disabled:text-gray-500"
              />
            ) : (
              <h2
                onClick={() => {
                  if (!isSaving) {
                    setTempTitle(epic.title);
                    setIsEditingTitle(true);
                  }
                }}
                className="mt-2 cursor-pointer rounded-lg border border-transparent px-2 py-1 text-xl font-bold tracking-tight text-[#0A192F] hover:border-[#CBD5E1] hover:bg-[#F4F7FF]/30 sm:text-2xl transition-colors"
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
                className="mt-4 w-full resize-y rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#4A5568] focus:border-[#0046AD] focus:outline-none focus:ring-1 focus:ring-[#0046AD] disabled:bg-gray-50 disabled:text-gray-500"
              />
            ) : (
              <p
                onClick={() => {
                  if (!isSaving) {
                    setTempDescription(epic.description || '');
                    setIsEditingDescription(true);
                  }
                }}
                className="mt-4 cursor-pointer rounded-lg border border-transparent px-2 py-1.5 text-sm leading-relaxed text-[#4A5568] hover:border-[#CBD5E1] hover:bg-[#F4F7FF]/30 transition-colors whitespace-pre-wrap min-h-[2.5rem]"
              >
                {epic.description || 'No description provided'}
              </p>
            )}

            {/* Meta Grid: 3 Columns */}
            <div className="mt-6 grid grid-cols-1 gap-6 border-t border-b border-[#CBD5E1]/60 py-5 sm:grid-cols-3">
              {/* Creator Column */}
              <div>
                <span className="block text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
                  Created By
                </span>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E2ECFF] text-[10px] font-bold text-[#0046AD]">
                    {getAvatarLetters(epic.created_by?.name || 'Unknown')}
                  </div>
                  <span className="truncate text-sm font-semibold text-[#0A192F]">
                    {epic.created_by?.name || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Assignee Column */}
              <div className="relative" ref={assigneeDropdownRef}>
                <span className="block text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
                  Assignee
                </span>

                {isEditingAssignee ? (
                  <div className="relative mt-2.5">
                    <button
                      type="button"
                      disabled={isSaving}
                      className="flex w-full items-center gap-2 rounded-lg border border-[#0046AD] bg-[#F4F7FF] px-2 py-1 text-left text-sm text-[#0A192F] focus:outline-none"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#CBD5E1] text-[10px] font-bold text-[#4A5568]">
                        {getAvatarLetters(epic.assignee?.name || 'Unassigned')}
                      </div>
                      <span className="truncate text-sm font-semibold">
                        {epic.assignee?.name || 'Unassigned'}
                      </span>
                    </button>

                    <div className="absolute left-0 mt-1 z-[100] w-64 rounded-xl border border-[#CBD5E1] bg-white p-1 shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => handleSaveField('assignee_id', null)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F4F7FF] transition-colors"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500">
                          —
                        </div>
                        <span className="font-medium text-[#4A5568]">Unassigned</span>
                      </button>

                      {members.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSaveField('assignee_id', member.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F4F7FF] transition-colors"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#E2ECFF] text-[10px] font-bold text-[#0046AD]">
                            {getAvatarLetters(member.name)}
                          </div>
                          <span className="truncate font-medium text-[#0A192F]">{member.name}</span>
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
                    className="mt-2.5 flex cursor-pointer items-center gap-2 rounded-lg border border-transparent p-1 transition-colors hover:border-[#CBD5E1] hover:bg-[#F4F7FF]/30"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E2ECFF] text-[10px] font-bold text-[#0046AD]">
                      {getAvatarLetters(epic.assignee?.name || 'Unassigned')}
                    </div>
                    <span className="truncate text-sm font-semibold text-[#0A192F]">
                      {epic.assignee?.name || 'Unassigned'}
                    </span>
                  </div>
                )}
              </div>

              {/* Deadline Column */}
              <div>
                <span className="block text-[10px] font-bold tracking-wider text-[#4A5568] uppercase">
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
                    className="mt-2.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-2 py-1 text-sm text-[#0A192F] focus:border-[#0046AD] focus:outline-none"
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (!isSaving) {
                        setIsEditingDeadline(true);
                      }
                    }}
                    className="mt-2.5 flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent p-1 text-sm font-semibold text-[#0A192F] transition-colors hover:border-[#CBD5E1] hover:bg-[#F4F7FF]/30"
                  >
                    <Calendar size={15} className="shrink-0 text-[#4A5568]" />
                    <span>{formatDate(epic.deadline)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Created At Detail */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-[#4A5568]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Created At:</span>
              <Calendar size={13} className="shrink-0" />
              <span>{formatDate(epic.created_at)}</span>
            </div>

            {/* Epic Tasks Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0A192F]">Tasks</h3>
                <button
                  type="button"
                  onClick={() => router.push(`/project/${projectId}/tasks/new?epic_id=${epic.id}`)}
                  className="flex items-center gap-1 text-xs font-bold text-[#0046AD] hover:underline"
                >
                  + Add Task
                </button>
              </div>

              {/* Tasks Empty State Container */}
              <div className="mt-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F4F7FF]/30 p-8 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#E2ECFF] text-[#0046AD]">
                  <ClipboardList size={20} />
                </div>
                <p className="text-xs font-medium text-[#4A5568]">
                  No tasks have been added to this epic yet
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/project/${projectId}/tasks/new?epic_id=${epic.id}`)}
                  className="mt-4 rounded-lg bg-[#0046AD] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2]"
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

const MOBILE_QUERY = '(max-width: 767px)';

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

  // State management for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calculate total pages needed using Math.ceil(totalCount / EPICS_PAGE_SIZE)
  const totalPages = getTotalPages(totalCount, EPICS_PAGE_SIZE);
  const isLastPage = currentPage >= totalPages;
  const hasMoreMobile = epics.length < totalCount;

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
  const showingText = isMobile
    ? `Showing ${epics.length} of ${totalCount} epics`
    : `Showing ${rangeStart + 1}-${rangeEnd + 1} of ${totalCount} epics`;

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
              <EpicRow key={epic.id} epic={epic} onClick={() => setSelectedEpicId(epic.id)} />
            ))}
          </div>

          {/* Infinite Scroll loading indicator for Mobile */}
          {isMobile && isLoadingMore && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#4A5568]">
              <Loader2 size={18} className="animate-spin text-[#0046AD]" />
              Loading more epics...
            </div>
          )}

          {/* Sentinel element to trigger load next page when visible */}
          {isMobile && hasMoreMobile && <div ref={loadMoreRef} className="h-4" aria-hidden />}

          {/* Desktop Pagination Controls */}
          {!isMobile && totalPages > 1 && (
            <div className="mt-8 flex flex-col gap-4 border-t border-[#CBD5E1]/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-[#4A5568]">{showingText}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#4A5568] transition-colors hover:bg-[#F4F7FF] disabled:cursor-not-allowed disabled:border-[#CBD5E1] disabled:text-[#CBD5E1]"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((page, index) => {
                  const prevPage = pageNumbers[index - 1];
                  const showEllipsis = prevPage !== undefined && page - prevPage > 1;

                  return (
                    <span key={page} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-xs text-[#4A5568]">...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors ${
                          page === currentPage
                            ? 'bg-[#0046AD] font-bold text-white'
                            : 'border border-[#CBD5E1] text-[#4A5568] hover:bg-[#F4F7FF]'
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
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#4A5568] transition-colors hover:bg-[#F4F7FF] disabled:cursor-not-allowed disabled:border-[#CBD5E1] disabled:text-[#CBD5E1]"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Simple footer count display for mobile screens */}
          {isMobile && totalCount > 0 && (
            <p className="mt-6 text-center text-xs font-medium text-[#4A5568]">{showingText}</p>
          )}
        </>
      )}

      {/* Render the details popup when an epic is selected */}
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
    </div>
  );
}
