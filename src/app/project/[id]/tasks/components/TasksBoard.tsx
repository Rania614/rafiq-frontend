import { TASK_STATUSES } from '@/utils/tasks';
import { BOARD_COLUMNS_CLASS } from '../constants';
import TaskColumn from './TaskColumn';

interface TasksBoardProps {
  projectId: string;
}

export default function TasksBoard({ projectId }: TasksBoardProps) {
  return (
    <div className={BOARD_COLUMNS_CLASS}>
      {TASK_STATUSES.map((status) => (
        <TaskColumn key={status} projectId={projectId} status={status} />
      ))}
    </div>
  );
}
