import { NextRequest, NextResponse } from 'next/server';
import { STORAGE_BUCKET, supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidSlug, isValidUrl } from '@/lib/validate';
import type { UpdateLinkInput } from '@/lib/types';

export const runtime = 'nodejs';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  let body: UpdateLinkInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストボディが不正です。' },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};

  if (body.slug !== undefined) {
    const slug = body.slug.trim();
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        {
          error:
            'slugは半角英数字・ハイフン・アンダースコアのみ、1〜64文字で入力してください。',
        },
        { status: 400 }
      );
    }
    const { data: existing } = await supabaseAdmin
      .from('links')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (existing && existing.id !== params.id) {
      return NextResponse.json(
        { error: 'このslugは既に使用されています。' },
        { status: 409 }
      );
    }
    update.slug = slug;
  }

  if (body.destination_url !== undefined) {
    const destinationUrl = body.destination_url.trim();
    if (!isValidUrl(destinationUrl)) {
      return NextResponse.json(
        { error: '遷移先URLが正しくありません。' },
        { status: 400 }
      );
    }
    update.destination_url = destinationUrl;
  }

  if (body.og_title !== undefined) {
    const ogTitle = body.og_title.trim();
    if (!ogTitle) {
      return NextResponse.json(
        { error: 'カードタイトルを入力してください。' },
        { status: 400 }
      );
    }
    update.og_title = ogTitle;
  }

  if (body.og_description !== undefined) {
    update.og_description = body.og_description.trim();
  }
  if (body.button_text !== undefined) {
    update.button_text = body.button_text.trim() || 'タップで再生 ▶';
  }
  if (body.play_overlay !== undefined) {
    update.play_overlay = body.play_overlay;
  }
  if (body.og_image !== undefined) {
    update.og_image = body.og_image;
  }
  if (body.original_image !== undefined) {
    update.original_image = body.original_image;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: '更新する項目がありません。' },
      { status: 400 }
    );
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('links')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    console.error('update link error', error);
    return NextResponse.json(
      { error: 'リンクの更新に失敗しました。' },
      { status: 500 }
    );
  }

  return NextResponse.json({ link: data });
}

function extractStoragePath(publicUrl: string | null): string | null {
  if (!publicUrl) return null;
  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { data: existing } = await supabaseAdmin
    .from('links')
    .select('og_image, original_image')
    .eq('id', params.id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('links')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('delete link error', error);
    return NextResponse.json(
      { error: 'リンクの削除に失敗しました。' },
      { status: 500 }
    );
  }

  if (existing) {
    const paths = [
      extractStoragePath(existing.og_image),
      extractStoragePath(existing.original_image),
    ].filter((p): p is string => Boolean(p));

    if (paths.length > 0) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(paths);
    }
  }

  return NextResponse.json({ ok: true });
}
