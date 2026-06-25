import { TASK_STATUSES, type TaskStatus } from '@/utils/tasks';
import { BOARD_COLUMNS_CLASS } from '../constants';
import type { Task } from '../types';
import TaskColumn from './TaskColumn';

interface TasksBoardProps {
  projectId: string;
  tasksByStatus: Record<TaskStatus, Task[]>;
  onOpenTaskDetails: (taskId: string) => void;
}

export default function TasksBoard({
  projectId,
  tasksByStatus,
  onOpenTaskDetails,
}: TasksBoardProps) {
  return (
    <div className={BOARD_COLUMNS_CLASS}>
      {TASK_STATUSES.map((status) => (
        <TaskColumn
          key={status}
          projectId={projectId}
          status={status}
          tasks={tasksByStatus[status]}
          onOpenTaskDetails={onOpenTaskDetails}
        />
      ))}
    </div>
  );
}
