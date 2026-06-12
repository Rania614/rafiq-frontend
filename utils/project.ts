const CURRENT_PROJECT_ID_KEY = 'current_project_id';

const PROJECT_SCOPED_ROUTE =
  /^\/project\/([^/]+)\/(?:edit|members|tasks|epics(?:\/new)?)$/;

export function setCurrentProjectId(projectId: string): void {
  sessionStorage.setItem(CURRENT_PROJECT_ID_KEY, projectId);
}

export function clearCurrentProjectId(): void {
  sessionStorage.removeItem(CURRENT_PROJECT_ID_KEY);
}

export function getCurrentProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(CURRENT_PROJECT_ID_KEY);
}

export function getProjectIdFromPath(pathname: string): string | null {
  return pathname.match(PROJECT_SCOPED_ROUTE)?.[1] ?? null;
}

export function isProjectScopedPath(pathname: string): boolean {
  return PROJECT_SCOPED_ROUTE.test(pathname);
}

export function getProjectEditHref(projectId: string): string {
  return `/project/${projectId}/edit`;
}

export function getProjectMembersHref(projectId: string): string {
  return `/project/${projectId}/members`;
}

export function getProjectEpicsHref(projectId: string): string {
  return `/project/${projectId}/epics`;
}

export function getProjectEpicsNewHref(projectId: string): string {
  return `/project/${projectId}/epics/new`;
}

export function getProjectTasksHref(projectId: string): string {
  return `/project/${projectId}/tasks`;
}
