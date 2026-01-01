# Next.js App Router ベストプラクティス

本プロジェクトでは、以下の Next.js App Router のベストプラクティスを遵守して開発を行います。

## 1. Server Components vs Client Components
- **デフォルトは Server Components**: すべてのコンポーネントをデフォルトで Server Component として作成し、必要な場合にのみ Client Component に変換します。
- **Client Component の最小化**: ユーザーのインタラクション（`onClick`, `useState`, `useEffect` 等）が必要な末端のコンポーネントのみを `"use client"` とします。
- **データの機密性**: 秘密鍵や API キーを扱うロジックは必ず Server Components または Server Actions で実行します。

## 2. データ取得 (Data Fetching)
- **サーバー側でのフェッチ**: 可能な限り Server Components 内でデータを直接取得します。
- **並列フェッチ**: 依存関係のないデータ取得は `Promise.all` 等を使用して並列に実行し、ウォーターフォールを防ぎます。
- **キャッシュの活用**: `fetch` API のキャッシュ機能（`force-cache`, `revalidate`）を適切に設定します。

## 3. データ更新 (Server Actions)
- **フォーム送信とアクション**: データの作成・更新・削除には Server Actions を使用します。
- **楽観的更新 (Optimistic Updates)**: `useOptimistic` フックを使用して、サーバーのレスポンスを待たずに UI を即時更新し、UX を向上させます。
- **再検証**: 更新後は `revalidatePath` または `revalidateTag` を使用して、最新のデータを画面に反映させます。

## 4. レンダリングとパフォーマンス
- **ストリーミング**: `Suspense` コンポーネントや `loading.tsx` を活用し、重い処理を待たずに一部の UI を先に表示させます。
- **静的・動的レンダリング**: ユーザー固有のデータが含まれないページは静的生成（SSG）されるように構成します。
- **画像の最適化**: `next/image` を使用し、LCP の改善と適切なリサイズを行います。

## 5. ルーティングとメタデータ
- **コロケーション**: コンポーネント、テストファイル、スタイルなどは、関連するルートディレクトリ内に配置（Colocation）することを検討します。
- **Metadata API**: `generateMetadata` を使用して、SEO に必要なメタデータを動的に生成します。

## 6. エラーハンドリング
- **error.tsx**: ルートごとのエラー境界を定義し、アプリケーション全体がクラッシュするのを防ぎます。
- **not-found.tsx**: 存在しないリソースへのアクセスに対して、適切な 404 ページを表示します。

