import { STATUS_BADGE_STYLES } from '../constants';
import { formatStatusLabel } from '../helpers';
import type { TaskStatus } from '@/utils/tasks';

interface TaskStatusBadgeProps {
  status: string;
}

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const normalizedStatus = status as TaskStatus;
  const badgeClass = STATUS_BADGE_STYLES[normalizedStatus] ?? 'bg-[#E8EDFF] text-[#434654]';

  return (
    <span
      className={`inline-flex rounded-sm px-2 py-1 text-[10px] font-medium uppercase ${badgeClass}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
