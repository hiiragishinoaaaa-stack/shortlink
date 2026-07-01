import { cache } from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { LinkRow } from '@/lib/types';

// Wrapped in React's cache() so generateMetadata() and the page component
// share a single Supabase query per request instead of fetching twice.
export const getLinkBySlug = cache(async (slug: string): Promise<LinkRow | null> => {
  const { data, error } = await supabaseAdmin
    .from('links')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('failed to fetch link by slug', error);
    return null;
  }
  return data;
});
