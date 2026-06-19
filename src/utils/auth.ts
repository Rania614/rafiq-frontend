import Cookies from 'js-cookie';

/**
 * Represents the authentication session tokens and user data.
 */
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user?: Record<string, unknown>;
}

const cookieDefaults = {
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Retrieves the current access token from cookies or local storage.
 * 
 * @returns The access token string, or an empty string if not found.
 */
export function getAccessToken(): string {
  return Cookies.get('access_token') || localStorage.getItem('access_token') || '';
}

/**
 * Persists the authentication session tokens and user data.
 * Stores in cookies for general access and local storage as a fallback.
 * 
 * @param session - The authentication session details to save.
 * @param rememberMe - Whether to persist the session for 30 days (true) or session-only (false).
 */
export function saveAuthSession(session: AuthSession, rememberMe = false): void {
  const options = {
    ...cookieDefaults,
    expires: rememberMe ? 30 : undefined,
  };

  Cookies.set('access_token', session.access_token, options);
  Cookies.set('refresh_token', session.refresh_token, options);

  if (session.user) {
    Cookies.set('user_session', JSON.stringify(session.user), options);
  }

  localStorage.setItem('access_token', session.access_token);
  localStorage.setItem('refresh_token', session.refresh_token);
}

/**
 * Completely clears all authentication data from cookies, local storage, and session storage.
 * Typically called during logout.
 */
export function clearAuthSession(): void {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  Cookies.remove('user_session');

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.clear();
}

/**
 * Safely parses the error response from the Supabase API to extract a readable error message.
 * 
 * @param response - The raw Fetch API Response object.
 * @param fallback - A default error message to return if parsing fails.
 * @returns A promise resolving to the extracted error message.
 */
export async function parseSupabaseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.msg || data.error_description || data.message || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Normalizes user metadata from different potential Supabase formats into a unified structure.
 * 
 * @param user - The raw user object returned from Supabase.
 * @returns A normalized user profile object containing email, name, and job title.
 */
export function normalizeUserProfile(user: Record<string, unknown>) {
  const metadata =
    (user.user_metadata as Record<string, string> | undefined) ||
    (user.raw_user_meta_data as Record<string, string> | undefined) ||
    {};

  return {
    email: user.email as string,
    raw_user_meta_data: {
      name: metadata.name || '',
      job_title: metadata.job_title || undefined,
    },
  };
}
