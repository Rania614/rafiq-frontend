'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { getAccessToken } from '@/utils/auth';
import { acceptInvitation } from '../api/acceptInvitation';

export default function InviteAcceptanceCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setErrorMsg('Invalid invitation: The invitation token is missing.');
      return;
    }
    setToken(tokenParam);

    const accessToken = getAccessToken();
    if (!accessToken) {
      setIsAuthenticated(false);
      // Construct current invite URL to pass to login redirectTo
      const returnUrl = window.location.pathname + window.location.search;
      router.replace(`/login?redirectTo=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setIsAuthenticated(true);
  }, [searchParams, router]);

  const handleAcceptInvitation = async () => {
    if (!token || isAccepting) return;

    setIsAccepting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await acceptInvitation({ token });
      setSuccessMsg('Invitation accepted successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.replace('/project');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept invitation.');
      setIsAccepting(false);
    }
  };

  // While checking auth, show loading state
  if (isAuthenticated === null && !errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
        <Loader2 className="animate-spin text-[#0046AD]" size={36} />
        <p className="text-sm font-semibold text-[#0A192F]">Checking invitation details...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md border border-[#CBD5E1]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight animate-fade-in">Project Invitation</h1>
        <p className="mt-2 text-sm text-[#4A5568]">
          {!token ? 'Invalid Link' : 'You have been invited to join a project.'}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 flex gap-3 items-start animate-fade-in">
          <AlertCircle size={20} className="shrink-0 text-[#D31818] mt-0.5" />
          <div className="flex-1 text-sm font-medium text-[#D31818]">
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 rounded-lg bg-emerald-50 p-4 border border-emerald-200 flex gap-3 items-start animate-fade-in">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-700 mt-0.5" />
          <div className="flex-1 text-sm font-semibold text-emerald-800">
            {successMsg}
          </div>
        </div>
      )}

      {token && isAuthenticated && !successMsg && (
        <div className="space-y-6 animate-fade-in">
          <p className="text-sm leading-relaxed text-[#4A5568] text-center">
            Click the button below to accept the invitation and gain access to the project workspace and tasks.
          </p>

          <button
            type="button"
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="w-full rounded-lg bg-[#0046AD] py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2] disabled:bg-[#CBD5E1] flex items-center justify-center gap-2"
          >
            {isAccepting && <Loader2 className="animate-spin" size={16} />}
            {isAccepting ? 'Accepting Invitation...' : 'Accept Invitation'}
          </button>
        </div>
      )}

      {!token && (
        <div className="space-y-6 text-center animate-fade-in">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-[#D31818]">
            <ShieldAlert size={24} />
          </div>
          <p className="text-sm leading-relaxed text-[#4A5568]">
            This invitation link is invalid or has expired. Please check with the project administrator to receive a new invite link.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/project')}
            className="w-full rounded-lg border border-[#CBD5E1] py-3 text-sm font-bold text-[#4A5568] hover:bg-slate-50 transition-colors"
          >
            Go to Projects
          </button>
        </div>
      )}
    </div>
  );
}
