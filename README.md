# OGカード差し替え短縮リンクツール

ログイン不要で使える、OGカード（X投稿時のリンクカード）差し替え専用の短縮リンク作成ツールです。

OneLinkなどの遷移先URLと、カードに表示したいタイトル・説明・画像を登録すると、
独自の短縮URL（例: `https://b-shortlink.example.com/aespa001`）が発行されます。
そのURLをXに投稿すると、登録した画像・タイトル・説明がカードとして表示され、
カードをタップ（クリック）すると登録した遷移先URLへリダイレクトされます。

## 主な機能

- ログイン不要（誰でもトップページからリンクを作成・編集・削除可能）
- リンク作成フォーム（slug / 遷移先URL / カードタイトル / カード説明 / カード画像 / 再生ボタン合成ON-OFF / ボタン文言）
- 作成済みリンクの一覧表示・編集・削除
- `/[slug]` へのアクセス時、サーバー側でOGタグ・Twitterカードタグを埋め込んだHTMLを返却
- 通常アクセス（人間）には中間ページを表示し、ボタンを押すと遷移先URLへ移動
- クリック数の記録
- アップロード画像を1200×630に自動リサイズし、中央に半透明の黒い丸＋白い再生▶アイコンを合成（ON/OFF切替可能）
- 加工済み画像はSupabase Storageに保存し、そのURLを `og:image` / `twitter:image` に使用

## 技術構成

- Next.js 14 (App Router) / TypeScript
- Tailwind CSS
- Supabase (Postgres DB + Storage)
- sharp（画像リサイズ・合成）
- Vercelデプロイ対応

---

## 1. Supabaseのセットアップ

### 1-1. プロジェクト作成

1. https://supabase.com でプロジェクトを作成します。
2. 「Project Settings」→「API」から以下を控えます。
   - `Project URL`（`NEXT_PUBLIC_SUPABASE_URL`になります）
   - `service_role` キー（`SUPABASE_SERVICE_ROLE_KEY`になります。**絶対に公開しないこと**）

### 1-2. テーブル作成（SQL）

Supabaseダッシュボードの **SQL Editor** を開き、`supabase/schema.sql` の内容をそのまま貼り付けて実行してください。

`links` テーブルと、クリック数をインクリメントする関数 `increment_click_count` が作成されます。

```sql
-- supabase/schema.sql の内容（抜粋）
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
```

ファイル全文は `supabase/schema.sql` を参照してください。

### 1-3. Storage bucketの作成

アップロードした画像（加工後のOG画像・元画像）を保存するためのバケットを作成します。

**方法A: ダッシュボードのGUIから作成する場合**

1. Supabaseダッシュボードの「Storage」を開く
2. 「New bucket」をクリック
3. Name: `og-images`
4. **Public bucket をON**にする（Xのbotが画像を取得できるよう、公開読み取り可能にする必要があります）
5. 「Create bucket」で作成完了

**方法B: SQLから作成する場合**

SQL Editorで `supabase/storage.sql` の内容を実行してください。

```sql
insert into storage.buckets (id, name, public)
values ('og-images', 'og-images', true)
on conflict (id) do update set public = true;
```

バケット名を `og-images` 以外にした場合は、`.env` の `SUPABASE_STORAGE_BUCKET` をその名前に合わせてください。

> 補足: 画像のアップロード・削除はすべてサーバー側API（Service Roleキー）経由でのみ行われるため、
> anon/authenticatedロール向けのStorageポリシーを別途作成する必要はありません。

---

## 2. 環境変数

`.env.example` を `.env.local` にコピーして値を埋めてください。

```bash
cp .env.example .env.local
```

```ini
# Supabaseプロジェクト設定 (Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
# サーバー専用。クライアントに絶対公開しないこと（NEXT_PUBLIC_を付けない）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase StorageのバケットID
SUPABASE_STORAGE_BUCKET=og-images

# このアプリの公開URL（短縮URLの生成や og:url に使用）
# ローカル: http://localhost:3000
# 本番: https://b-shortlink.example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 3. ローカル起動手順

```bash
# 依存パッケージのインストール
npm install

# .envファイルを準備（上記「2. 環境変数」を参照）
cp .env.example .env.local
# ↑ 中身を実際の値に書き換える

# 開発サーバー起動
npm run dev
```

http://localhost:3000 を開くと、リンク作成フォームと一覧が表示されます。

動作確認の流れ:

1. トップページでフォームに入力し、画像をアップロードして「リンクを作成」
2. 発行された短縮URL（例: `http://localhost:3000/your-slug`）をブラウザで開く
3. 中間ページが表示され、画像・タイトル・説明・ボタンが表示されることを確認
4. ボタンを押すと遷移先URLにリダイレクトされ、一覧のクリック数が増えることを確認
5. 一覧の「編集」「削除」が動作することを確認

OGタグの確認は、ページのソースを表示（View Source / `curl`）して `<meta property="og:image">` 等が
最初から含まれていることを確認してください（クライアントJSの実行を待たずに確認できます）。

```bash
curl -s http://localhost:3000/your-slug | grep -i "og:"
```

---

## 4. Vercelデプロイ手順

1. このリポジトリをGitHubに push しておく
2. https://vercel.com で「Add New... → Project」からこのリポジトリをインポート
3. Framework Presetは自動的に `Next.js` が選択されます
4. 「Environment Variables」に以下を設定（Production / Preview 両方に設定推奨）

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | SupabaseのProject URL |
   | `SUPABASE_ANON_KEY` | Supabaseのanonキー（未使用だが参考として設定可） |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabaseのservice_roleキー |
   | `SUPABASE_STORAGE_BUCKET` | `og-images` |
   | `NEXT_PUBLIC_SITE_URL` | デプロイ後のドメイン（例: `https://b-shortlink.example.com` または `https://your-app.vercel.app`） |

5. 「Deploy」をクリック
6. デプロイ完了後、実際のドメインが確定したら `NEXT_PUBLIC_SITE_URL` をそのドメインに合わせて再設定し、再デプロイしてください
   （og:url や一覧画面の短縮URL表示に使われるため、正しいドメインに更新しておくことが重要です）

### 独自ドメインを使う場合

1. Vercelプロジェクトの「Settings → Domains」で独自ドメイン（例: `b-shortlink.example.com`）を追加
2. DNS設定をVercelの指示に従って設定
3. `NEXT_PUBLIC_SITE_URL` をその独自ドメインに更新して再デプロイ

### Xでのカード表示確認

Xに実際に投稿する前に、[Twitter Card Validator](https://cards-dev.twitter.com/validator) などのOGタグ検証ツールで
短縮URL（`https://your-domain/your-slug`）を確認することをおすすめします。
Xのクローラーはサーバーが返すHTMLの `<head>` を直接読み取るため、本実装のように
`generateMetadata` でサーバー側にOGタグを埋め込む構成であれば正しく認識されます。

---

## ディレクトリ構成

```
app/
  page.tsx                 トップページ（作成フォーム + 一覧）
  [slug]/page.tsx           OGタグ付き中間ページ
  api/links/route.ts        リンク一覧取得・作成
  api/links/[id]/route.ts   リンク編集・削除
  api/upload/route.ts       画像アップロード＋再生ボタン合成
  api/click/[slug]/route.ts クリック数記録
components/                 フォーム・一覧・編集モーダル等のUI
lib/                        Supabaseクライアント・画像加工・バリデーション
supabase/schema.sql         テーブル・関数定義
supabase/storage.sql        Storage bucket作成（SQL版）
```
