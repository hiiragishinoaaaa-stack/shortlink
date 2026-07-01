import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

interface RouteParams {
  params: { slug: string };
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { data, error } = await supabaseAdmin.rpc('increment_click_count', {
    p_slug: params.slug,
  });

  if (error) {
    console.error('increment click error', error);
    return NextResponse.json(
      { error: 'クリック数の記録に失敗しました。' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, click_count: data });
}
