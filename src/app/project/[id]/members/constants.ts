import { getAvatarLetters } from '@/utils/avatar';

export const SHADOW_SM = 'shadow-[0_1px_2px_0px_#0000000d]';

export const GRADIENT_BUTTON_BASE = `inline-flex items-center justify-center rounded-sm bg-gradient-to-br from-[#003D9B] to-[#0052CC] text-white ${SHADOW_SM}`;

export const INVITE_BUTTON_CLASS = `${GRADIENT_BUTTON_BASE} gap-2 px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-95`;

export const TABLE_WRAPPER_CLASS = 'lg:mx-auto lg:max-w-5/6 xl:max-w-3/4 overflow-hidden';

export const TABLE_HEAD_CLASS =
  'px-9 py-5 text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[#434654]';

export const TABLE_ROW_CLASS = 'border-b border-[#E8EDFF] bg-white last:border-b-0';

export const LABEL_CLASS = 'text-[11px] font-bold uppercase tracking-[0.6px] text-[#4F5F7B]';

export const FIELD_CLASS =
  'w-full rounded-sm border-0 bg-[#E0E8FF] px-4 py-3.5 text-sm text-[#434654] placeholder:text-[#737685]/70 transition-colors focus:outline focus:outline-1 focus:outline-[#003D9B]';

export const AVATAR_COLORS = [
  'bg-[#E0E8FF] text-[#003D9B]',
  'bg-[#D7E2FF] text-[#003D9B]',
  'bg-[#CDDDFF] text-[#4F5F7B]',
  'bg-[#E8EDFF] text-[#0052CC]',
  'bg-[#F1F3FF] text-[#434654]',
  'bg-[#D7E2FF] text-[#0052CC]',
];

export const ROLE_BADGE_STYLES: Record<string, string> = {
  owner: 'bg-[#0052CC] text-white',
  admin: 'bg-[#CDDDFF] text-[#4F5F7B]',
  member: 'bg-[#D7E2FF] text-[#434654]',
  viewer: 'bg-[#E8EDFF] text-[#434654]',
};

export const DEFAULT_ROLE_BADGE_STYLE = 'bg-[#D7E2FF] text-[#434654]';

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getRoleBadgeClass(role: string): string {
  return ROLE_BADGE_STYLES[role.toLowerCase()] ?? DEFAULT_ROLE_BADGE_STYLE;
}
