# アーキテクチャ設計書 (Architecture)

## 1. システム全体図
- **Frontend/Backend**: Next.js (App Router)
- **Database**: Turso (SQLite)
- **ORM**: Drizzle ORM
- **Authentication**: BetterAuth
- **Styling**: Tailwind CSS + Shadcn UI
- **AI Integration**: OpenAI SDK (または同等のAPI)

## 2. ディレクトリ構成案
```text
src/
├── app/                  # Next.js App Router (Pages, Layouts)
│   ├── (auth)/           # 認証関連画面 (Login, Signup)
│   ├── (dashboard)/      # メイン機能画面 (Home, Calendar, Journal)
│   ├── chat/             # AIチャット画面
│   └── api/              # API Route ハンドラー
├── components/           # 共通コンポーネント
│   ├── ui/               # Shadcn UI パーツ
│   ├── dashboard/        # ダッシュボード用パーツ
│   ├── calendar/         # カレンダー用パーツ
│   └── chat/             # チャット用パーツ
├── lib/                  # ユーティリティ・外部連携ライブラリ
│   ├── db/               # Turso / Drizzle 設定
│   ├── auth/             # BetterAuth 設定
│   └── ai/               # AI連携ロジック
├── schema/               # Drizzle データベーススキーマ
├── services/             # ビジネスロジック (DB操作等)
└── types/                # TypeScript 型定義
```

## 3. データフロー
1. **ユーザー操作**: ユーザーがダッシュボードで「成功/失敗」を記録。
2. **APIリクエスト**: `api/records` にデータを送信。
3. **認証チェック**: BetterAuth でセッションを確認。
4. **DB処理**: Drizzle ORM を通じて Turso に保存。
5. **AI処理**: 特定の条件（失敗時や相談時）にAI APIを呼び出し、レスポンスを取得。
6. **UI更新**: React の状態管理を通じて画面を更新。

## 4. AI 連携戦略
- **Prompt Engineering**: ユーザーの現在の状況（ストリーク日数、最近の記録）をコンテキストとしてAIに渡す。
- **Streaming**: チャット機能では、UX向上のためにストリーミングレスポンスを採用する。

## 5. 認証フロー
- BetterAuth を使用し、安全なセッション管理を実現。
- ミドルウェアを使用して、非ログインユーザーのアクセスを制限。

