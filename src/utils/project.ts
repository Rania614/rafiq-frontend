const CURRENT_PROJECT_ID_KEY = 'current_project_id';

const PROJECT_SCOPED_ROUTE =
  /^\/project\/([^/]+)\/(?:edit|members|tasks(?:\/new)?|epics(?:\/new)?)$/;

/**
 * Persists the currently active project ID into session storage.
 * This is used to maintain context when navigating within a specific project.
 *
 * @param projectId - The ID of the active project.
 */
export function setCurrentProjectId(projectId: string): void {
  sessionStorage.setItem(CURRENT_PROJECT_ID_KEY, projectId);
}

/**
 * Clears the currently active project ID from session storage.
 * Typically called when returning to the main projects list.
 */
export function clearCurrentProjectId(): void {
  sessionStorage.removeItem(CURRENT_PROJECT_ID_KEY);
}

/**
 * Retrieves the currently active project ID from session storage.
 *
 * @returns The active project ID or null if none is set or running on server.
 */
export function getCurrentProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(CURRENT_PROJECT_ID_KEY);
}

/**
 * Extracts the project ID from a given pathname string using regex matching.
 *
 * @param pathname - The current URL pathname.
 * @returns The extracted project ID or null if the path does not match a project scope.
 */
export function getProjectIdFromPath(pathname: string): string | null {
  return pathname.match(PROJECT_SCOPED_ROUTE)?.[1] ?? null;
}

/**
 * Checks if the current URL pathname belongs to a project-scoped route.
 *
 * @param pathname - The current URL pathname.
 * @returns True if the path is project-scoped, false otherwise.
 */
export function isProjectScopedPath(pathname: string): boolean {
  return PROJECT_SCOPED_ROUTE.test(pathname);
}

/**
 * Generates the URL path for the project edit page.
 *
 * @param projectId - The ID of the target project.
 * @returns The relative URL path.
 */
export function getProjectEditHref(projectId: string): string {
  return `/project/${projectId}/edit`;
}

/**
 * Generates the URL path for the project members page.
 *
 * @param projectId - The ID of the target project.
 * @returns The relative URL path.
 */
export function getProjectMembersHref(projectId: string): string {
  return `/project/${projectId}/members`;
}

/**
 * Generates the URL path for the project epics page.
 *
 * @param projectId - The ID of the target project.
 * @returns The relative URL path.
 */
export function getProjectEpicsHref(projectId: string): string {
  return `/project/${projectId}/epics`;
}

/**
 * Generates the URL path for the new epic creation page.
 *
 * @param projectId - The ID of the target project.
 * @returns The relative URL path.
 */
export function getProjectEpicsNewHref(projectId: string): string {
  return `/project/${projectId}/epics/new`;
}

/**
 * Generates the URL path for the project tasks page.
 *
 * @param projectId - The ID of the target project.
 * @returns The relative URL path.
 */
export function getProjectTasksHref(projectId: string): string {
  return `/project/${projectId}/tasks?view=board`;
}

export function getProjectTasksNewHref(projectId: string, status: string): string {
  return `/project/${projectId}/tasks/new?status=${encodeURIComponent(status)}`;
}
