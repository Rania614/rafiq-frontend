'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ClipboardList, CloudOff, Loader2, User, X } from 'lucide-react';
import { getAvatarLetters } from '@/utils/avatar';
import { getAccessToken } from '@/utils/auth';
import { supabaseAuthHeaders, supabaseRestUrl } from '@/utils/supabase';
import { GRADIENT_BUTTON_BASE, SHADOW_SM } from '../constants';
import {
  formatTaskDetailsDate,
  getAvatarColor,
  getTaskDueDate,
  getTaskPersonName,
} from '../helpers';
import type { TaskDetails, TaskDetailsModalState } from '../types';
import TaskStatusBadge from './TaskStatusBadge';

interface TaskDetailsModalProps {
  taskId: string;
  projectId: string;
  onClose: () => void;
}

function TaskMetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold tracking-wider text-[#434654] uppercase">
      {children}
    </span>
  );
}

function PersonField({
  label,
  name,
  fallback,
  seed,
}: {
  label: string;
  name: string;
  fallback: string;
  seed: string;
}) {
  const displayName = name || fallback;
  const avatarSeed = name || seed;

  return (
    <div>
      <TaskMetaLabel>{label}</TaskMetaLabel>
      <div className="mt-2.5 flex items-center gap-2">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${getAvatarColor(avatarSeed)}`}
        >
          {name ? getAvatarLetters(name) : <User size={14} />}
        </div>
        <span className="truncate text-sm font-semibold text-[#041B3C]">{displayName}</span>
      </div>
    </div>
  );
}

export default function TaskDetailsModal({ taskId, projectId, onClose }: TaskDetailsModalProps) {
  const router = useRouter();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [modalState, setModalState] = useState<TaskDetailsModalState>('loading');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchTaskDetails = async () => {
      setModalState('loading');
      setTask(null);

      try {
        const url = supabaseRestUrl(`/project_tasks?project_id=eq.${projectId}&id=eq.${taskId}`);

        const response = await fetch(url, {
          method: 'GET',
          headers: supabaseAuthHeaders(token),
        });

        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        if (!response.ok) {
          setModalState('error');
          return;
        }

        const data: TaskDetails[] = await response.json();
        if (data.length === 0) {
          setModalState('not_found');
          return;
        }

        setTask(data[0]);
        setModalState('success');
      } catch {
        setModalState('error');
      }
    };

    fetchTaskDetails();
  }, [taskId, projectId, router]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const assigneeName = task ? getTaskPersonName(task.assignee) : '';
  const reporterName = task ? getTaskPersonName(task.created_by) : '';
  const epicDisplayId = task?.epic?.epic_id ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#041B3C]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-details-title"
    >
      <div
        className={`relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-sm bg-white ${SHADOW_SM}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-sm p-1 text-[#434654] transition-colors hover:bg-[#F1F3FF]"
          aria-label="Close task details"
        >
          <X size={16} />
        </button>

        {modalState === 'loading' && (
          <div className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#003D9B]" />
            <p className="mt-2 text-sm text-[#434654]">Loading task details...</p>
          </div>
        )}

        {modalState === 'error' && (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#FFDBD6] text-[#BA1A1A]">
              <CloudOff size={24} />
            </div>
            <h3 className="text-lg font-semibold text-[#041B3C]">Failed to load task details</h3>
            <button
              type="button"
              onClick={onClose}
              className={`${GRADIENT_BUTTON_BASE} mt-6 px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-95`}
            >
              Close
            </button>
          </div>
        )}

        {modalState === 'not_found' && (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#E8EDFF] text-[#003D9B]">
              <ClipboardList size={24} />
            </div>
            <h3 className="text-lg font-semibold text-[#041B3C]">Task not found</h3>
            <button
              type="button"
              onClick={onClose}
              className={`${GRADIENT_BUTTON_BASE} mt-6 px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-95`}
            >
              Close
            </button>
          </div>
        )}

        {modalState === 'success' && task && (
          <div className="flex flex-col overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#003D9B]">
              <ClipboardList size={14} className="shrink-0" />
              <span>{task.task_id ?? task.id.slice(0, 8)}</span>
            </div>

            <h2
              id="task-details-title"
              className="mt-2 pr-8 text-xl font-bold text-[#041B3C] sm:text-2xl"
            >
              {task.title}
            </h2>

            <div className="mt-4">
              <TaskStatusBadge status={task.status} />
            </div>

            <div className="mt-6">
              <TaskMetaLabel>Description</TaskMetaLabel>
              <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-[#434654]">
                {task.description?.trim() || '—'}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <PersonField
                label="Assignee"
                name={assigneeName}
                fallback="Unassigned"
                seed={task.id}
              />
              <PersonField
                label="Reporter"
                name={reporterName}
                fallback="Unknown"
                seed={`${task.id}-reporter`}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <TaskMetaLabel>Due Date</TaskMetaLabel>
                <div className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-[#041B3C]">
                  <Calendar size={15} className="shrink-0 text-[#434654]" />
                  <span>{formatTaskDetailsDate(getTaskDueDate(task))}</span>
                </div>
              </div>
              <div>
                <TaskMetaLabel>Created At</TaskMetaLabel>
                <div className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-[#041B3C]">
                  <Calendar size={15} className="shrink-0 text-[#434654]" />
                  <span>{formatTaskDetailsDate(task.created_at)}</span>
                </div>
              </div>
            </div>

            {epicDisplayId && (
              <div className="mt-6">
                <TaskMetaLabel>Epic ID</TaskMetaLabel>
                <p className="mt-2 text-sm font-semibold text-[#003D9B]">{epicDisplayId}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
