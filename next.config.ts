import type { NextConfig } from 'next';

const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrlEnv?.trim()) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
      'Add it in Vercel → Project Settings → Environment Variables, then redeploy.'
  );
}

if (!supabaseAnonKeyEnv?.trim()) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add it in Vercel → Project Settings → Environment Variables, then redeploy.'
  );
}

const supabaseUrl = supabaseUrlEnv.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');

if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL must be a valid http(s) Supabase project URL (e.g. https://your-project.supabase.co).'
  );
}

const nextConfig: NextConfig = {};

export default nextConfig;
