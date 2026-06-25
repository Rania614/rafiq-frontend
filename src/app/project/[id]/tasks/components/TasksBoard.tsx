import { TASK_STATUSES, type TaskStatus } from '@/utils/tasks';
import type { Task } from '../types';
import TaskColumn from './TaskColumn';

interface TasksBoardProps {
  projectId: string;
  tasksByStatus: Record<TaskStatus, Task[]>;
  className: string;
  columnKeyPrefix?: string;
}

export default function TasksBoard({
  projectId,
  tasksByStatus,
  className,
  columnKeyPrefix = '',
}: TasksBoardProps) {
  return (
    <div className={className}>
      {TASK_STATUSES.map((status) => (
        <TaskColumn
          key={`${columnKeyPrefix}${status}`}
          projectId={projectId}
          status={status}
          tasks={tasksByStatus[status]}
        />
      ))}
    </div>
  );
}
