export interface TaskUser {
  name?: string;
}

export interface Task {
  id: string;
  task_id?: string;
  title: string;
  status: string;
  deadline?: string | null;
  assignee?: TaskUser | null;
}

export type PageState = 'loading' | 'success' | 'error' | 'empty';
export type ViewMode = 'board' | 'list';
