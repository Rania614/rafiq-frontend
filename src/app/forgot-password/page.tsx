'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Timer, ArrowLeft } from 'lucide-react';
import { supabaseAuthHeaders, supabaseAuthUrl } from '@/utils/supabase';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [trials, setTrials] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const onSubmit = async (values: ForgotFormValues) => {
    if (trials >= 3) {
      setApiError('You have exceeded the maximum number of trials (3 times).');
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      await fetch(supabaseAuthUrl('/auth/v1/recover'), {
        method: 'POST',
        headers: supabaseAuthHeaders(),
        body: JSON.stringify({ email: values.email }),
      });

      setSuccessMessage('If an account exists with this email, we’ve sent a password reset link.');
      setTrials((prev) => prev + 1);
      setTimeLeft(300);
    } catch (err) {
      setSuccessMessage('If an account exists with this email, we’ve sent a password reset link.');
      setTrials((prev) => prev + 1);
      setTimeLeft(300);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FF] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-[#CBD5E1]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0A192F] tracking-tight">Forgot password?</h1>
          <p className="mt-1.5 text-xs text-[#4A5568]">
            No worries, we’ll send you reset instructions.
          </p>
        </div>

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-[#D31818] font-medium border border-red-100">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A192F] mb-1.5">
              Email Address
            </label>
            <input
              {...register('email')}
              type="text"
              placeholder="Enter your email"
              className="w-full rounded-lg bg-[#E2ECFF]/30 border border-[#CBD5E1] px-4 py-2.5 text-sm text-[#0A192F] placeholder-[#4A5568]/40 focus:outline-none focus:border-[#0046AD] transition-colors"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-[#D31818] font-medium">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || timeLeft > 0 || trials >= 3}
            className="w-full rounded-lg bg-[#0046AD] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0056D2] disabled:bg-[#CBD5E1] disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-4 flex justify-center">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0046AD] hover:underline"
          >
            <ArrowLeft size={14} /> Back to log in
          </Link>
        </div>

        {successMessage && (
          <div className="mt-6 pt-6 border-t border-[#CBD5E1]/60 space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg bg-[#E8FBF0] p-3 text-xs text-[#107C41] font-medium border border-[#A3EBB5]">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#107C41] text-white text-[10px]">
                ✓
              </span>
              <p>{successMessage}</p>
            </div>

            <div className="text-center space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[#4A5568]">
                Didn't receive the email?
              </span>
              <button
                type="button"
                disabled={timeLeft > 0 || trials >= 3}
                onClick={handleSubmit(onSubmit)}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#F4F7FF] border border-[#CBD5E1] py-2.5 text-xs font-bold text-[#4A5568] disabled:opacity-60"
              >
                <Timer size={14} />
                {timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend Email'}
              </button>
              {trials > 0 && (
                <p className="text-[10px] text-[#4A5568]/70">Used {trials} of 3 trials</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
