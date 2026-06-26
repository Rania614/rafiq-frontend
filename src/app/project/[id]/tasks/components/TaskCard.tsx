import { AlertTriangle, Calendar } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { getAvatarLetters } from '@/utils/avatar';
import { BOARD_SHADOW } from '../constants';
import { getAvatarColor, getBoardDueLabel, getDueDateStatus } from '../helpers';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const { isDueToday, isDelayed } = getDueDateStatus(task.deadline);
  const dueLabel = getBoardDueLabel(task);
  const assigneeName = task.assignee?.name ?? '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex flex-col gap-4 rounded-lg border p-4 cursor-grab active:cursor-grabbing select-none transition-shadow duration-150 ${
        isDragging ? 'opacity-40 border-[#003D9B] border-dashed shadow-lg z-50' : BOARD_SHADOW
      } ${
        isDelayed && task.deadline
          ? 'border-[#BA1A1A]/10 bg-[#FFDBD6]/20'
          : 'border-[#C3C6D6]/10 bg-white'
      } ${isDueToday && task.deadline ? 'border-s-2 border-s-[#003D9B]' : ''}`}
    >
      <h3 className="font-medium leading-5 text-[#041B3C]">{task.title}</h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDelayed && task.deadline ? (
            <AlertTriangle size={12} className="shrink-0 text-[#BA1A1A]" />
          ) : (
            <Calendar
              size={12}
              className={`shrink-0 ${isDueToday ? 'text-[#003D9B]' : 'text-[#737685]/80'}`}
            />
          )}
          <span
            className={`text-[10px] font-bold ${
              isDelayed ? 'text-[#BA1A1A]' : isDueToday ? 'text-[#003D9B]' : 'text-[#737685]/80'
            }`}
          >
            {dueLabel}
          </span>
        </div>

        {assigneeName ? (
          <div
            className={`flex size-6 items-center justify-center rounded-full border border-white text-[9px] font-bold ${
              isDueToday ? 'bg-[#0052CC] text-white' : `${getAvatarColor(assigneeName)}`
            }`}
          >
            {getAvatarLetters(assigneeName)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
