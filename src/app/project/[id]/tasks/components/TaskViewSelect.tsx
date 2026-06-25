import { LayoutGrid, List } from 'lucide-react';
import { SHADOW_SM, VIEW_SELECT_CLASS } from '../constants';
import type { ViewMode } from '../types';

interface TaskViewSelectProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export default function TaskViewSelect({ value, onChange }: TaskViewSelectProps) {
  return (
    <div className="relative min-w-[176px]">
      {value === 'board' ? (
        <LayoutGrid className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#041B3C]" />
      ) : (
        <List className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#003D9B]" />
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ViewMode)}
        className={`${VIEW_SELECT_CLASS} w-full ${SHADOW_SM}`}
      >
        <option value="list">List View</option>
        <option value="board">Board View</option>
      </select>
    </div>
  );
}
