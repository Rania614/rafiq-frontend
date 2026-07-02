'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { saveAuthSession, parseSupabaseError } from '@/utils/auth';
import {
  isSupabaseConfigured,
  SUPABASE_CONFIGURATION_ERROR,
  supabaseAuthHeaders,
  supabaseAuthUrl,
} from '@/utils/supabase';
import { loginSchema, type LoginFormValues } from '../schema';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setApiError(null);

    if (!isSupabaseConfigured()) {
      setApiError(SUPABASE_CONFIGURATION_ERROR);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(supabaseAuthUrl('/auth/v1/token?grant_type=password'), {
        method: 'POST',
        headers: supabaseAuthHeaders(),
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const message = await parseSupabaseError(response, 'Invalid email or password');
        setApiError(message);
        return;
      }

      const data = await response.json();
      saveAuthSession(data, values.rememberMe);

      const redirectTo = searchParams.get('redirectTo');
      router.push(redirectTo || '/project');
    } catch {
      setApiError('Unable to connect. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FF] p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md border border-[#CBD5E1]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-sm text-[#4A5568]">Sign in to your Taskly workspace.</p>
        </div>

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#D31818] font-medium animate-fade-in">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A192F] mb-1.5">
              Email
            </label>
            <input
              {...register('email')}
              type="text"
              placeholder="yourname@company.com"
              className="w-full rounded-lg bg-[#E2ECFF]/50 border border-[#CBD5E1] px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 focus:outline-none focus:border-[#0046AD] transition-colors"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-[#D31818] font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0A192F]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#0046AD] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full rounded-lg bg-[#E2ECFF]/50 border border-[#CBD5E1] px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 focus:outline-none focus:border-[#0046AD] pr-10 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#0A192F]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-[#D31818] font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...register('rememberMe')}
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-[#CBD5E1] text-[#0046AD] focus:ring-[#0046AD]"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 text-xs font-medium text-[#4A5568] select-none cursor-pointer"
            >
              Remember me for 1 month
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#0046AD] py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2] disabled:bg-[#CBD5E1]"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#4A5568]">
          Don’t have an account?{' '}
          <Link href="/sign-up" className="font-semibold text-[#0046AD] hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
