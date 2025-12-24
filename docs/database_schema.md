# データベーススキーマ設計 (Database Schema)

## 1. テーブル構成

### 1.1 `users` (Managed by BetterAuth)
- ユーザー基本情報。BetterAuth が自動生成するフィールドを含む。

### 1.2 `streaks` (ストリーク情報)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | integer (PK) | ユニークID |
| `user_id` | text (FK) | ユーザーID |
| `current_streak` | integer | 現在の継続日数 |
| `max_streak` | integer | 過去最高記録 |
| `started_at` | timestamp | ストリーク開始日時 |
| `updated_at` | timestamp | 最終更新日時 |

### 1.3 `daily_records` (日次記録)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | integer (PK) | ユニークID |
| `user_id` | text (FK) | ユーザーID |
| `date` | text (ISO date) | 記録対象の日付 |
| `status` | text | 'success' (成功) or 'failure' (失敗) |
| `journal` | text (Nullable) | その日の日記・反省 |
| `created_at` | timestamp | 作成日時 |

### 1.4 `ai_conversations` (AIチャット履歴)
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | integer (PK) | ユニークID |
| `user_id` | text (FK) | ユーザーID |
| `role` | text | 'user' or 'assistant' |
| `content` | text | メッセージ内容 |
| `context_type` | text | 'general', 'emergency', 'advice' |
| `created_at` | timestamp | 作成日時 |

## 2. インデックス設計
- `daily_records` の `user_id` と `date` にユニーク制約を設け、1日1レコードを保証する。
- `ai_conversations` の `user_id` にインデックスを貼り、履歴取得を高速化する。

## 3. Drizzle ORM スキーマ案
```typescript
// src/schema/index.ts (イメージ)
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const dailyRecords = sqliteTable("daily_records", {
  id: integer("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  status: text("status", { enum: ["success", "failure"] }).notNull(),
  journal: text("journal"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ... 他のテーブル定義 ...
```

