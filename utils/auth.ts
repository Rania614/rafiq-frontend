import Cookies from 'js-cookie';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user?: Record<string, unknown>;
}

const cookieDefaults = {
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

export function getAccessToken(): string {
  return Cookies.get('access_token') || localStorage.getItem('access_token') || '';
}

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

export function clearAuthSession(): void {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
  Cookies.remove('user_session');

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.clear();
}

export async function parseSupabaseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.msg || data.error_description || data.message || fallback;
  } catch {
    return fallback;
  }
}

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
