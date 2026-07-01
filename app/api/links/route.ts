import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidSlug, isValidUrl } from '@/lib/validate';
import type { CreateLinkInput } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('list links error', error);
    return NextResponse.json(
      { error: 'リンク一覧の取得に失敗しました。' },
      { status: 500 }
    );
  }

  return NextResponse.json({ links: data });
}

export async function POST(req: NextRequest) {
  let body: Partial<CreateLinkInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストボディが不正です。' },
      { status: 400 }
    );
  }

  const slug = (body.slug || '').trim();
  const destinationUrl = (body.destination_url || '').trim();
  const ogTitle = (body.og_title || '').trim();
  const ogDescription = (body.og_description || '').trim();
  const buttonText = (body.button_text || 'タップで再生 ▶').trim();
  const playOverlay = body.play_overlay !== false;

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      {
        error:
          'slugは半角英数字・ハイフン・アンダースコアのみ、1〜64文字で入力してください。',
      },
      { status: 400 }
    );
  }
  if (!isValidUrl(destinationUrl)) {
    return NextResponse.json(
      { error: '遷移先URLが正しくありません。' },
      { status: 400 }
    );
  }
  if (!ogTitle) {
    return NextResponse.json(
      { error: 'カードタイトルを入力してください。' },
      { status: 400 }
    );
  }

  const { data: existing } = await supabaseAdmin
    .from('links')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'このslugは既に使用されています。' },
      { status: 409 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('links')
    .insert({
      slug,
      destination_url: destinationUrl,
      og_title: ogTitle,
      og_description: ogDescription,
      og_image: body.og_image ?? null,
      original_image: body.original_image ?? null,
      play_overlay: playOverlay,
      button_text: buttonText,
    })
    .select('*')
    .single();

  if (error) {
    console.error('create link error', error);
    return NextResponse.json(
      { error: 'リンクの作成に失敗しました。' },
      { status: 500 }
    );
  }

  return NextResponse.json({ link: data }, { status: 201 });
}
