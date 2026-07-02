import { UserPlus, Users } from 'lucide-react';
import { INVITE_BUTTON_CLASS } from '../constants';

interface MembersEmptyStateProps {
  onInvite: () => void;
}

export default function MembersEmptyState({ onInvite }: MembersEmptyStateProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center sm:mx-auto sm:max-w-md lg:min-h-[60vh]">
      <div className="flex flex-col items-center gap-11">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-[#F1F3FF] text-[#0052CC]">
          <Users size={36} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-[28px] font-semibold tracking-[-0.75px] text-[#041B3C]">
            No members yet
          </h2>
          <p className="text-sm leading-6 tracking-[0.6px] text-[#434654]">
            This project doesn&apos;t have any members. Invite teammates to collaborate on tasks and
            epics.
          </p>
        </div>
        <button type="button" onClick={onInvite} className={INVITE_BUTTON_CLASS}>
          <UserPlus size={18} />
          Invite member
        </button>
      </div>
    </div>
  );
}
