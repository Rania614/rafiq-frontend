function normalizeSupabaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
}

function readSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const normalized = normalizeSupabaseUrl(raw);
  return normalized.startsWith('http://') || normalized.startsWith('https://') ? normalized : '';
}

export const supabaseUrl = readSupabaseUrl();
export const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export const SUPABASE_CONFIGURATION_ERROR =
  'Application configuration error. Please contact the administrator.';

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseConfigurationError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable.';
  }

  const normalized = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    return 'NEXT_PUBLIC_SUPABASE_URL must be a valid http(s) URL.';
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.';
  }

  return null;
}

export function supabaseAuthUrl(path: string): string {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${supabaseUrl}${normalizedPath}`;
}

export function supabaseAuthHeaders(token?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function supabaseRestUrl(path: string): string {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${supabaseUrl}/rest/v1${normalizedPath}`;
}

export async function parseSupabaseRestError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await response.json();
    return data.message || data.msg || data.error_description || data.hint || fallback;
  } catch {
    return fallback;
  }
}
