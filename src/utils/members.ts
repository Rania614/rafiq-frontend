export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function emailUsername(email: string): string | null {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) {
    return null;
  }

  const username = email.slice(0, atIndex).trim();
  return username.length > 0 ? username : null;
}

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = asNonEmptyString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

/**
 * Resolves a member display name from API payloads returned by get_project_members.
 * Priority: full_name → name → email username → Unknown
 */
export function getMemberDisplayName(raw: Record<string, unknown>): string {
  const metadata = asRecord(raw.metadata);
  const userMetadata = asRecord(raw.user_metadata ?? raw.raw_user_meta_data);

  const fullName = firstNonEmptyString(metadata?.full_name, userMetadata?.full_name, raw.full_name);

  if (fullName) {
    return fullName;
  }

  const name = firstNonEmptyString(metadata?.name, userMetadata?.name, raw.name, raw.user_name);

  if (name) {
    return name;
  }

  const email = firstNonEmptyString(metadata?.email, userMetadata?.email, raw.email);

  if (email) {
    return emailUsername(email) ?? 'Unknown';
  }

  return 'Unknown';
}

export function normalizeProjectMember(raw: Record<string, unknown>): ProjectMember {
  const metadata = asRecord(raw.metadata);
  const userMetadata = asRecord(raw.user_metadata ?? raw.raw_user_meta_data);

  const email = firstNonEmptyString(metadata?.email, userMetadata?.email, raw.email) ?? '';

  return {
    id: String(raw.user_id ?? raw.id ?? raw.member_id ?? ''),
    name: getMemberDisplayName(raw),
    email,
    role: String(raw.role ?? 'member').toLowerCase(),
  };
}
