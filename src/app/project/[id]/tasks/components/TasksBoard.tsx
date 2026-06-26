import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { TASK_STATUSES, type TaskStatus } from '@/utils/tasks';
import { BOARD_COLUMNS_CLASS } from '../constants';
import TaskColumn from './TaskColumn';

interface TasksBoardProps {
  projectId: string;
  refreshKey?: number;
  onTaskStatusChange: (
    taskId: string,
    currentStatus: TaskStatus,
    newStatus: TaskStatus
  ) => Promise<void>;
}

export default function TasksBoard({
  projectId,
  refreshKey = 0,
  onTaskStatusChange,
}: TasksBoardProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const currentStatus = active.data.current?.status as TaskStatus | undefined;

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
            refreshKey={refreshKey}
          />
        ))}
      </div>
    </DndContext>
  );
}
