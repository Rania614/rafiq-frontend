function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return raw.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
}

export const supabaseUrl = getSupabaseUrl();
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function supabaseAuthUrl(path: string): string {
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
