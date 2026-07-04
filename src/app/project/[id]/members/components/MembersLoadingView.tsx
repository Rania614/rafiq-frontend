import { TABLE_WRAPPER_CLASS, TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '../constants';

function MemberRowSkeletonDesktop() {
  return (
    <tr className={TABLE_ROW_CLASS}>
      <td className="px-9 py-5">
        <div className="flex animate-pulse items-center gap-4">
          <div className="size-12 shrink-0 rounded-lg bg-[#E8EDFF]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-4 w-24 max-w-full rounded bg-[#E8EDFF]" />
            <div className="h-3 w-36 max-w-full rounded bg-[#F1F3FF]" />
          </div>
        </div>
      </td>
      <td className="px-9 py-5 text-center">
        <div className="mx-auto inline-block h-6 w-16 animate-pulse rounded-full bg-[#E8EDFF]" />
      </td>
      <td className="px-9 py-5">
        <div className="flex animate-pulse justify-end">
          <div className="size-8 rounded-sm bg-[#F1F3FF]" />
        </div>
      </td>
    </tr>
  );
}

function MemberRowSkeletonMobile() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-white p-4">
      <div className="flex flex-1 animate-pulse items-center gap-4">
        <div className="size-12 shrink-0 rounded-lg bg-[#E8EDFF]" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-4 w-24 max-w-full rounded bg-[#E8EDFF]" />
          <div className="h-3 w-36 max-w-full rounded bg-[#F1F3FF]" />
        </div>
      </div>
      <div className="flex animate-pulse items-center gap-1">
        <div className="h-6 w-14 rounded-full bg-[#E8EDFF]" />
        <div className="size-8 rounded-sm bg-[#F1F3FF]" />
      </div>
    </div>
  );
}

export default function MembersLoadingView() {
  const skeletonRows = Array.from({ length: 4 });

  return (
    <>
      <header className="mb-5 flex animate-pulse items-center justify-between lg:mb-10">
        <div className="mx-auto h-10 w-48 max-w-full rounded-md bg-[#E8EDFF] lg:mx-0" />
        <div className="hidden h-10 w-36 rounded-md bg-[#E8EDFF] lg:block" />
      </header>

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
          {skeletonRows.map((_, index) => (
            <MemberRowSkeletonDesktop key={index} />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {skeletonRows.map((_, index) => (
          <MemberRowSkeletonMobile key={index} />
        ))}
      </div>
    </>
  );
}
