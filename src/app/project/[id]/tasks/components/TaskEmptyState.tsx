import Link from 'next/link';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { getProjectTasksNewHref } from '@/utils/project';
import { DEFAULT_TASK_STATUS } from '@/utils/tasks';
import { NEW_TASK_BUTTON_CLASS } from '../constants';

interface TaskEmptyStateProps {
  projectId: string;
}

export default function TaskEmptyState({ projectId }: TaskEmptyStateProps) {
  return (
    <section className="flex items-center justify-center lg:min-h-[60vh]">
      <div className="flex max-w-md flex-col items-center gap-6 px-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg bg-[#D7E2FF] text-[#003D9B]">
          <ClipboardList size={22} />
        </div>
        <p className="text-sm leading-6 text-[#434654]">
          No tasks have been added to this project yet. Create your first task to start tracking
          work across the board.
        </p>
        <Link
          href={getProjectTasksNewHref(projectId, DEFAULT_TASK_STATUS)}
          className={NEW_TASK_BUTTON_CLASS}
        >
          <Plus size={16} />
          Create Task
        </Link>
      </div>
    </section>
  );
}

export function TaskSearchEmptyState() {
  return (
    <section className="flex items-center justify-center lg:min-h-[40vh]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-[#F1F3FF] text-[#0052CC]">
          <Search size={36} strokeWidth={1.25} />
        </div>
        <h2 className="text-2xl font-semibold tracking-[-0.75px] text-[#041B3C]">
          No tasks found matching your search
        </h2>
      </div>
    </section>
  );
}
