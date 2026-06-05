'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCurrentUser } from '@/store/slices/userSlice';
import AppShell from '../components/AppShell';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { data: user } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, user]);

  return <AppShell>{children}</AppShell>;
}
