-- Storage bucketをSQLで作成したい場合はこちらを実行してください。
-- ダッシュボードのGUIから作成する場合はREADMEの手順を使えば、このファイルは不要です。

insert into storage.buckets (id, name, public)
values ('og-images', 'og-images', true)
on conflict (id) do update set public = true;

-- 公開バケットなので誰でも画像を閲覧できますが (Xのbotが取得するため必須)、
-- アップロード/更新/削除はService Roleキー経由のみに制限します
-- (anon/authenticatedロール向けのINSERT/UPDATE/DELETEポリシーは作成しません)。
