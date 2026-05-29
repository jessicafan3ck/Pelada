import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_KEY as string;

if (!url || !key) {
  console.error('[Supabase] Missing env vars — VITE_SUPABASE_URL or VITE_SUPABASE_KEY is undefined. Check Vercel environment variables.');
}

export const supabase = createClient(url ?? '', key ?? '');
