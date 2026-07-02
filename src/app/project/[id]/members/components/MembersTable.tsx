import { type ProjectMember } from '@/utils/members';
import { MemberRowDesktop, MemberRowMobile } from './MemberRow';
import { TABLE_WRAPPER_CLASS, TABLE_HEAD_CLASS } from '../constants';

interface MembersTableProps {
  members: ProjectMember[];
}

export default function MembersTable({ members }: MembersTableProps) {
  return (
    <>
      <table
        className={`hidden w-full table-fixed border-collapse rounded-lg md:table ${TABLE_WRAPPER_CLASS}`}
      >
        <thead>
          <tr className="bg-[#F1F3FF]/50">
            <th className={`${TABLE_HEAD_CLASS} w-1/2`}>Member</th>
            <th className={`${TABLE_HEAD_CLASS} w-1/4 text-center`}>Role</th>
            <th className={`${TABLE_HEAD_CLASS} w-1/4 text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <MemberRowDesktop key={member.id} member={member} />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {members.map((member) => (
          <MemberRowMobile key={member.id} member={member} />
        ))}
      </div>
    </>
  );
}
