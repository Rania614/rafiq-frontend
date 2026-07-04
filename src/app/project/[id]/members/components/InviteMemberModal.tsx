'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { inviteMember } from '../api/inviteMember';
import {
  SHADOW_SM,
  LABEL_CLASS,
  FIELD_CLASS,
  GRADIENT_BUTTON_BASE
} from '../constants';

interface InviteMemberModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function InviteMemberModal({ projectId, onClose, onSuccess }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await inviteMember({
        email,
        projectId,
        appUrl: window.location.origin,
      });
      onSuccess('Invitation sent successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#041B3C]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-member-title"
    >
      <div
        className={`relative w-full max-w-lg rounded-sm bg-white p-6 sm:p-8 ${SHADOW_SM}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 rounded-sm p-1 text-[#434654] transition-colors hover:bg-[#F1F3FF] disabled:opacity-50"
          aria-label="Close invite member dialog"
        >
          <X size={18} />
        </button>

        <header className="mb-8 pr-8">
          <h2
            id="invite-member-title"
            className="text-2xl font-semibold capitalize leading-8 text-[#041B3C]"
          >
            invite member
          </h2>
          <p className="mt-1 text-sm text-[#434654]">
            Send an invitation to add a new collaborator to this project.
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#D31818] font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-email" className={LABEL_CLASS}>
              email address <span className="text-[#BA1A1A]">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              required
              placeholder="colleague@company.com"
              className={FIELD_CLASS}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-sm px-6 py-3 text-base font-bold text-[#4F5F7B] transition-colors hover:text-[#041B3C] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`${GRADIENT_BUTTON_BASE} px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-95 disabled:opacity-55`}
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
