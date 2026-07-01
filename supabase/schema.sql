-- OGカード差し替え短縮リンクツール: Supabaseスキーマ
-- Supabaseダッシュボードの SQL Editor にこの内容を貼り付けて実行してください。

create extension if not exists "pgcrypto";

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  destination_url text not null,
  og_title text not null,
  og_description text not null default '',
  og_image text,
  original_image text,
  play_overlay boolean not null default true,
  button_text text not null default 'タップで再生 ▶',
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists links_slug_idx on public.links (slug);
create index if not exists links_created_at_idx on public.links (created_at desc);

-- クリック数をアトミックにインクリメントする関数。
-- /api/click/[slug] から supabase.rpc('increment_click_count', { p_slug }) として呼び出されます。
create or replace function public.increment_click_count(p_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.links
  set click_count = click_count + 1,
      updated_at = now()
  where slug = p_slug
  returning click_count into new_count;

  return new_count;
end;
$$;

-- このアプリはログイン機能を持たず、サーバー側API (Service Roleキー) からのみ
-- テーブルにアクセスします。RLSを有効化し、anon/authenticatedロールへの
-- ポリシーは作成しないことで、クライアントから直接アクセスできないようにします。
alter table public.links enable row level security;
