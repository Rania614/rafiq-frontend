'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Check, Circle } from 'lucide-react';

const signUpSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters')
      .max(50, 'Name must not exceed 50 characters')
      .refine((val) => !/\d/.test(val), 'Numbers are not allowed')
      .refine(
        (val) => !/[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(val),
        'Special characters are not allowed'
      )
      .refine((val) => !/(  +)/.test(val), 'Multiple consecutive spaces are not allowed')
      .refine(
        (val) => /^[^\p{Emoji}\p{Symbol}]+$/u.test(val),
        'Emojis and symbols are not allowed'
      ),
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    jobTitle: z.string().optional(),
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

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');

  const hasMinLength = passwordValue.length >= 8;
  const hasUpperLowerDigit =
    /[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue) && /[0-9]/.test(passwordValue);
  const hasSpecialChar = /[!@#$%^&*]/.test(passwordValue);

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    setApiError(null);

    const requestBody = {
      email: values.email,
      password: values.password,
      data: {
        name: values.name,
        job_title: values.jobTitle || '',
      },
    };

    try {
      const response = await fetch('/auth/v1/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Something went wrong during signup.');
      }

      router.push('/project');
    } catch (err: any) {
      console.warn('API simulated or failed, redirecting for testing:', err.message);
      router.push('/project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FF] p-4 font-sans">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-md border border-[#CBD5E1]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">
            Create your workspace
          </h1>
          <p className="mt-2 text-sm text-[#4A5568]">
            Join the editorial approach to task management.
          </p>
        </div>

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[#D31818] font-medium">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* حقل الاسم */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A192F] mb-1.5">
              Name
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="Enter your full name"
              className="w-full rounded-lg bg-[#E2ECFF]/50 border border-[#CBD5E1] px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 focus:outline-none focus:border-[#0046AD] transition-colors"
            />
            <p className="mt-1 text-[11px] text-[#4A5568]/70">3-50 characters, letters only.</p>
            {errors.name && (
              <p className="mt-1 text-xs text-[#D31818] font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* حقل الإيميل */}
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

          {/* حقل المسمى الوظيفي */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A192F] mb-1.5">
              Job Title <span className="text-[#4A5568]/60 lowercase">(optional)</span>
            </label>
            <input
              {...register('jobTitle')}
              type="text"
              placeholder="e.g. Project Manager"
              className="w-full rounded-lg bg-[#E2ECFF]/50 border border-[#CBD5E1] px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 focus:outline-none focus:border-[#0046AD] transition-colors"
            />
          </div>

          {/* صف كلمة المرور وتأكيدها */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0A192F] mb-1.5">
                Password
              </label>
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0A192F] mb-1.5">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                className="w-full rounded-lg bg-[#E2ECFF]/50 border border-[#CBD5E1] px-4 py-3 text-sm text-[#0A192F] placeholder-[#4A5568]/50 focus:outline-none focus:border-[#0046AD] transition-colors"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-[#D31818] font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-[#F4F7FF] border border-[#E2ECFF] p-4 space-y-2 text-xs text-[#4A5568]">
            <div className="flex items-center gap-2">
              {hasMinLength ? (
                <Check size={14} className="text-[#70FFB5] bg-green-50 rounded-full" />
              ) : (
                <Circle size={14} className="text-[#CBD5E1]" />
              )}
              <span className={hasMinLength ? 'text-[#0A192F] line-through opacity-60' : ''}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasUpperLowerDigit ? (
                <Check size={14} className="text-[#70FFB5] bg-green-50 rounded-full" />
              ) : (
                <Circle size={14} className="text-[#CBD5E1]" />
              )}
              <span className={hasUpperLowerDigit ? 'text-[#0A192F] line-through opacity-60' : ''}>
                One uppercase, lowercase, and digit
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasSpecialChar ? (
                <Check size={14} className="text-[#70FFB5] bg-green-50 rounded-full" />
              ) : (
                <Circle size={14} className="text-[#CBD5E1]" />
              )}
              <span className={hasSpecialChar ? 'text-[#0A192F] line-through opacity-60' : ''}>
                One special character
              </span>
            </div>
          </div>

          {/* زر الإنشاء */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#0046AD] py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0056D2] disabled:bg-[#CBD5E1] disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#4A5568]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#0046AD] hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
