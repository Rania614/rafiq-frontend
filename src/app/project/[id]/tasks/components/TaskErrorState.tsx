import { CloudOff } from 'lucide-react';
import { GRADIENT_BUTTON_BASE } from '../constants';

interface TaskErrorStateProps {
  onRetry: () => void;
}

export default function TaskErrorState({ onRetry }: TaskErrorStateProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center lg:min-h-[60vh]">
      <div className="flex flex-col items-center gap-11 sm:max-w-md">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#FFDBD6] text-[#BA1A1A]">
          <CloudOff size={32} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-[28px] font-semibold tracking-[-0.75px] text-[#041B3C]">
            Something went wrong
          </h2>
          <p className="text-sm leading-6 text-[#434654]">
            We&apos;re having trouble retrieving tasks right now. Please try again in a moment.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className={`${GRADIENT_BUTTON_BASE} px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-95`}
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
