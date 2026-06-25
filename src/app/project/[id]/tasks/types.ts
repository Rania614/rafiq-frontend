export interface TaskUser {
  name?: string;
  email?: string;
}

export interface TaskEpic {
  id?: string;
  epic_id?: string;
  title?: string;
}

export interface Task {
  id: string;
  task_id?: string;
  title: string;
  status: string;
  deadline?: string | null;
  due_date?: string | null;
  assignee?: TaskUser | null;
}

export interface TaskDetails extends Task {
  description?: string | null;
  created_at?: string | null;
  created_by?: TaskUser | null;
  epic?: TaskEpic | null;
  epic_id?: string | null;
}

export type TaskDetailsModalState = 'loading' | 'success' | 'error' | 'not_found';

export type PageState = 'loading' | 'success' | 'error' | 'empty';
export type ViewMode = 'board' | 'list';
