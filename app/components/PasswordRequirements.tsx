import { Check, Circle } from 'lucide-react';

interface RequirementsProps {
  value: string;
}

export default function PasswordRequirements({ value }: RequirementsProps) {
  const isLengthValid = value.length >= 8 && value.length <= 64;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%^&*]/.test(value);

  return (
    <div className="rounded-xl bg-[#F4F7FF] border border-[#CBD5E1]/40 p-4 space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4A5568]/80 border-b border-[#CBD5E1]/50 pb-1.5">
        Security Requirements
      </span>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-[#4A5568]">
        <div className="flex items-center gap-1.5">
          {isLengthValid ? (
            <Check size={12} className="text-[#107C41]" />
          ) : (
            <Circle size={12} className="text-[#CBD5E1]" />
          )}
          <span className={isLengthValid ? 'opacity-50 line-through' : ''}>8-64 characters</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasUppercase ? (
            <Check size={12} className="text-[#107C41]" />
          ) : (
            <Circle size={12} className="text-[#CBD5E1]" />
          )}
          <span className={hasUppercase ? 'opacity-50 line-through' : ''}>Uppercase letter</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasLowercase ? (
            <Check size={12} className="text-[#107C41]" />
          ) : (
            <Circle size={12} className="text-[#CBD5E1]" />
          )}
          <span className={hasLowercase ? 'opacity-50 line-through' : ''}>Lowercase letter</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasDigit ? (
            <Check size={12} className="text-[#107C41]" />
          ) : (
            <Circle size={12} className="text-[#CBD5E1]" />
          )}
          <span className={hasDigit ? 'opacity-50 line-through' : ''}>One digit</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          {hasSpecial ? (
            <Check size={12} className="text-[#107C41]" />
          ) : (
            <Circle size={12} className="text-[#CBD5E1]" />
          )}
          <span className={hasSpecial ? 'opacity-50 line-through' : ''}>Special character</span>
        </div>
      </div>
    </div>
  );
}
