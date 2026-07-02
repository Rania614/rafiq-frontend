'use client';

import { Suspense } from 'react';
import LoginForm from './components/LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-xs text-[#0A192F] min-h-screen flex items-center justify-center">Loading login workspace...</div>}>
      <LoginForm />
    </Suspense>
  );
}
