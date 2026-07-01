import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { LinkRow } from '@/lib/types';
import LinkManager from '@/components/LinkManager';

export const dynamic = 'force-dynamic';

async function getLinks(): Promise<LinkRow[]> {
  const { data, error } = await supabaseAdmin
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('failed to load links', error);
    return [];
  }
  return data ?? [];
}

export default async function HomePage() {
  const links = await getLinks();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">OGカード差し替え短縮リンク</h1>
        <p className="mt-1 text-sm text-neutral-400">
          元URLとカード画像を登録すると、X投稿時のリンクカードを差し替えられる短縮URLを発行します。ログイン不要。
        </p>
      </header>
      <LinkManager initialLinks={links} />
    </main>
  );
}
