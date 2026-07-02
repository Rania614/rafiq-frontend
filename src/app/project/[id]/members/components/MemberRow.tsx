import { MoreVertical } from 'lucide-react';
import { type ProjectMember } from '@/utils/members';
import { getAvatarLetters } from '@/utils/avatar';
import {
  getAvatarColor,
  getRoleBadgeClass,
  TABLE_ROW_CLASS
} from '../constants';

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${getRoleBadgeClass(role)}`}
    >
      {role}
    </span>
  );
}

function MemberInfo({ member }: { member: ProjectMember }) {
  const avatarLetters = getAvatarLetters(member.name);
  const avatarColor = getAvatarColor(member.email || member.name);

  return (
    <div className="flex min-w-0 items-center gap-4">
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase ${avatarColor}`}
      >
        {avatarLetters}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold capitalize text-[#041B3C]">{member.name}</p>
        <p className="truncate text-[11px] text-[#434654]">{member.email}</p>
      </div>
    </div>
  );
}

function MemberActions({ member }: { member: ProjectMember }) {
  const isOwner = member.role.toLowerCase() === 'owner';

  if (isOwner) return null;

  return (
    <button
      type="button"
      className="rounded-sm p-1 text-[#434654]/60 transition-colors hover:bg-[#F1F3FF] hover:text-[#434654]"
      aria-label={`Actions for ${member.name}`}
    >
      <MoreVertical size={16} />
    </button>
  );
}

export function MemberRowDesktop({ member }: { member: ProjectMember }) {
  return (
    <tr className={`${TABLE_ROW_CLASS} hidden md:table-row`}>
      <td className="w-1/2 px-9 py-5">
        <MemberInfo member={member} />
      </td>
      <td className="w-1/4 px-9 py-5 text-center">
        <RoleBadge role={member.role} />
      </td>
      <td className="w-1/4 px-9 py-5">
        <div className="flex justify-end">
          <MemberActions member={member} />
        </div>
      </td>
    </tr>
  );
}

export function MemberRowMobile({ member }: { member: ProjectMember }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-white p-4 md:hidden">
      <MemberInfo member={member} />
      <div className="flex shrink-0 items-start gap-1">
        <RoleBadge role={member.role} />
        <MemberActions member={member} />
      </div>
    </div>
  );
}
