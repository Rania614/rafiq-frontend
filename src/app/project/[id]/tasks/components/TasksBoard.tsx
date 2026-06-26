import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { TASK_STATUSES, type TaskStatus } from '@/utils/tasks';
import { BOARD_COLUMNS_CLASS } from '../constants';
import type { Task } from '../types';
import TaskColumn from './TaskColumn';

interface TasksBoardProps {
  projectId: string;
  tasksByStatus: Record<TaskStatus, Task[]>;
  onTaskStatusChange: (taskId: string, currentStatus: TaskStatus, newStatus: TaskStatus) => Promise<void>;
}

export default function TasksBoard({
  projectId,
  tasksByStatus,
  onTaskStatusChange,
}: TasksBoardProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Find the current status of the dragged task
    let currentStatus: TaskStatus | null = null;
    for (const status of TASK_STATUSES) {
      if (tasksByStatus[status].some((t) => t.id === taskId)) {
        currentStatus = status;
        break;
      }
    }

    if (!currentStatus || currentStatus === newStatus) return;

    onTaskStatusChange(taskId, currentStatus, newStatus);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={BOARD_COLUMNS_CLASS}>
        {TASK_STATUSES.map((status) => (
          <TaskColumn
            key={status}
            projectId={projectId}
            status={status}
            tasks={tasksByStatus[status]}
          />
        ))}
      </div>
    </DndContext>
  );
}
