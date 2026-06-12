'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Check, Circle, ArrowLeft } from 'lucide-react';
import { supabaseAuthHeaders, supabaseAuthUrl } from '@/utils/supabase';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password must not exceed 64 characters')
      .refine((val) => !/\s/.test(val), 'Whitespace is not allowed')
      .refine((val) => /[A-Z]/.test(val), 'Must contain at least one uppercase letter')
      .refine((val) => /[a-z]/.test(val), 'Must contain at least one lowercase letter')
      .refine((val) => /[0-9]/.test(val), 'Must contain at least one digit')
      .refine((val) => /[!@#$%^&*]/.test(val), 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token') || searchParams.get('access_token');

      if (accessToken) {
        setToken(accessToken);
      } else {
        setErrorMessage('Invalid or expired reset link.');
      }
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');

  const isLengthValid = passwordValue.length >= 8 && passwordValue.length <= 64;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasDigit = /[0-9]/.test(passwordValue);
  const hasSpecial = /[!@#$%^&*]/.test(passwordValue);

  const onSubmit = async (values: ResetPasswordValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await fetch(supabaseAuthUrl('/auth/v1/user'), {
        method: 'PUT',
        headers: supabaseAuthHeaders(token),
        body: JSON.stringify({ password: values.password }),
      });

      setSuccessMessage('Your password has been updated successfully. You can now log in');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setSuccessMessage('Your password has been updated successfully. You can now log in');
      setTimeout(() => router.push('/login'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-[#CBD5E1] text-center space-y-4">
        <p className="text-xs text-[#D31818] font-semibold">{errorMessage}</p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0046AD] hover:underline"
        >
          <ArrowLeft size={14} /> Request a new reset link
        </Link>
        <div>
          <Link href="/login" className="text-xs font-semibold text-[#4A5568] hover:underline">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-[#CBD5E1]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A192F] tracking-tight">Create a New Password</h1>
        <p className="mt-1.5 text-xs text-[#4A5568]">
          Create a new, strong password to secure your workstation access.
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-xs text-green-700 font-medium border border-green-100">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0A192F] mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              className="w-full rounded-lg bg-[#E2ECFF]/30 border border-[#CBD5E1] px-4 py-2.5 text-sm text-[#0A192F] focus:outline-none focus:border-[#0046AD] pr-10 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-[#D31818] font-medium">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0A192F] mb-1.5">
            Confirm Password
          </label>
          <input
            {...register('confirmPassword')}
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat your password"
            className="w-full rounded-lg bg-[#E2ECFF]/30 border border-[#CBD5E1] px-4 py-2.5 text-sm text-[#0A192F] focus:outline-none focus:border-[#0046AD] transition-colors"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-[#D31818] font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

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
              <span className={isLengthValid ? 'opacity-50 line-through' : ''}>
                8-64 characters
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasUppercase ? (
                <Check size={12} className="text-[#107C41]" />
              ) : (
                <Circle size={12} className="text-[#CBD5E1]" />
              )}
              <span className={hasUppercase ? 'opacity-50 line-through' : ''}>
                Uppercase letter
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasLowercase ? (
                <Check size={12} className="text-[#107C41]" />
              ) : (
                <Circle size={12} className="text-[#CBD5E1]" />
              )}
              <span className={hasLowercase ? 'opacity-50 line-through' : ''}>
                Lowercase letter
              </span>
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[#0046AD] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0056D2] disabled:bg-[#CBD5E1]"
        >
          {isLoading ? 'Updating...' : 'Update Password'}
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
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FF] p-4">
      <Suspense fallback={<div className="text-xs text-[#0A192F]">Loading session context...</div>}>
        <ResetPasswordFormContent />
      </Suspense>
    </main>
  );
}
