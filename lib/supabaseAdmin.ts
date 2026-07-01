import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
}

// Server-only client using the service role key. Never import this file
// from a Client Component — it must only run on the server, since the
// service role key bypasses Row Level Security.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || 'og-images';
