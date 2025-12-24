# BetterAuth データスキーマ要件

BetterAuth を正しく動作させるために必要なデータベーススキーマおよび実装上の注意点をまとめます。

## 1. 必須テーブル構成 (Drizzle ORM / SQLite)

BetterAuth の基本機能（Email/Password 認証等）には、以下の 4 つのテーブルが最低限必要です。

### 1.1 `user` (ユーザー)
- `id`: 文字列 (Primary Key)
- `name`: 文字列 (Not Null)
- `email`: 文字列 (Unique, Not Null)
- `emailVerified`: ブール値 (Default: false)
- `image`: 文字列 (Nullable)
- `createdAt`: タイムスタンプ (Not Null)
- `updatedAt`: タイムスタンプ (Not Null)

### 1.2 `session` (セッション)
- `id`: 文字列 (Primary Key)
- `userId`: 文字列 (Foreign Key -> user.id, Cascade Delete)
- `token`: 文字列 (Unique, Not Null)
- `expiresAt`: タイムスタンプ (Not Null)
- `ipAddress`: 文字列 (Nullable)
- `userAgent`: 文字列 (Nullable)
- `createdAt`: タイムスタンプ (Not Null)
- `updatedAt`: タイムスタンプ (Not Null)

### 1.3 `account` (アカウント/OAuth用)
- `id`: 文字列 (Primary Key)
- `userId`: 文字列 (Foreign Key -> user.id, Cascade Delete)
- `accountId`: 文字列 (Not Null)
- `providerId`: 文字列 (Not Null)
- `accessToken`: 文字列 (Nullable)
- `refreshToken`: 文字列 (Nullable)
- `expiresAt`: タイムスタンプ (Nullable)
- `password`: 文字列 (Nullable, Password認証に使用)

### 1.4 `verification` (検証用トークン)
- `id`: 文字列 (Primary Key)
- `identifier`: 文字列 (Not Null)
- `value`: 文字列 (Not Null)
- `expiresAt`: タイムスタンプ (Not Null)

## 2. スキーマ生成のベストプラクティス

BetterAuth には、使用している ORM に合わせてスキーマを自動生成する CLI が用意されています。

```bash
# スキーマの生成 (Drizzle 等)
npx @better-auth/cli generate
```

手動で定義する場合は、BetterAuth の公式ドキュメントにある `drizzle-orm` 用のスニペットを正確にコピーして使用してください。

## 3. カスタムフィールドの追加

本アプリ特有のフィールド（例: `role` など）を追加したい場合は、`betterAuth` の設定で `additionalFields` を使用します。

```typescript
// auth.ts のイメージ
export const auth = betterAuth({
  user: {
    additionalFields: {
      // 必要に応じて追加
    },
  },
});
```

## 4. 実装上の注意点
- **ID の形式**: デフォルトではランダムな文字列が ID として使用されます。
- **パスワードのハッシュ化**: BetterAuth が内部で処理するため、手動でハッシュ化する必要はありません。
- **セッション管理**: Cookie ベースのセッション管理がデフォルトです。ミドルウェアでのセッションチェックを忘れずに行います。

