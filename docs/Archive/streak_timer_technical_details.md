# ストリーク自動カウント機能 技術詳細・実装ガイド

## 概要

このドキュメントは、ストリーク自動カウント機能の実装における技術的な詳細、既存コードとの統合ポイント、注意事項をまとめたものです。

## アーキテクチャ概要

```
┌─────────────────┐
│  Client (UI)    │
│                 │
│  StreakCounter  │ ← 1秒間隔で経過時間を表示
│  StartButton    │ ← 開始日時を確定
└────────┬────────┘
         │
         │ Server Actions
         │
┌────────▼────────┐
│  Server Actions │
│                 │
│  startStreak()  │ ← 開始日時を確定
│  recordDay()    │ ← 失敗時に開始日時をリセット
└────────┬────────┘
         │
         │ Database
         │
┌────────▼────────┐
│  streaks table  │
│                 │
│  startedAt      │ ← 開始日時（timestamp）
│  currentStreak  │ ← 互換性のため保持
└─────────────────┘
```

## データベーススキーマ

### streaks テーブル（既存）

```typescript
export const streaks = sqliteTable("streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  startedAt: integer("started_at", { mode: "timestamp" }), // ← これを利用
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
```

### 変更点

- **変更なし**: スキーマ自体は変更不要
- **利用方法**: `startedAt` を開始日時として利用
- **互換性**: `currentStreak` は後方互換性のため保持（表示は算出値を優先）

## サーバーアクション詳細

### 1. startStreak() - 開始日時確定

**ファイル**: `app/actions/streak.ts` (新規作成)

```typescript
"use server";

import { db } from "@/lib/db";
import { streaks } from "@/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function startStreak() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // 既存のストリークを確認
  const existingStreak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  // 既に開始日時が設定されている場合は何もしない
  if (existingStreak?.startedAt) {
    return { success: true, alreadyStarted: true };
  }

  const now = new Date();

  if (existingStreak) {
    // ストリークレコードが存在する場合は更新
    await db.update(streaks)
      .set({
        startedAt: now,
        currentStreak: 0, // 互換性のため
        updatedAt: now,
      })
      .where(eq(streaks.id, existingStreak.id));
  } else {
    // ストリークレコードが存在しない場合は作成
    await db.insert(streaks).values({
      userId,
      startedAt: now,
      currentStreak: 0,
      maxStreak: 0,
      updatedAt: now,
    });
  }

  revalidatePath("/");
  return { success: true, alreadyStarted: false };
}
```

**重要なポイント**:
- 既に `startedAt` が存在する場合は何もしない（ガード）
- サーバー側で制御することで改ざんを防止
- `currentStreak` は互換性のため1に初期化

### 2. recordDay() - 失敗時の開始日時リセット

**ファイル**: `app/actions/records.ts` (既存ファイルを修正)

**修正箇所**: `recordDay()` 関数内の失敗処理

```typescript
// 失敗時 (status === "failure") の処理
if (status === "failure") {
  // 開始日時を無効化
  if (userStreak) {
    await db.update(streaks)
      .set({
        startedAt: null, // ← これを追加
        currentStreak: 0,
        startedAt: null, // 既存の startedAt 更新処理を確認
        updatedAt: new Date(),
      })
      .where(eq(streaks.id, userStreak.id));
  }
}
```

**注意**: 既存のコードを確認し、`startedAt = null` が設定されているか確認する。

## クライアント側ユーティリティ

### calculateElapsedTime() - 経過時間計算

**ファイル**: `lib/streak-timer.ts` (新規作成)

```typescript
export interface ElapsedTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function calculateElapsedTime(startedAt: Date | null): ElapsedTime | null {
  if (!startedAt) {
    return null;
  }

  const now = new Date();
  const started = new Date(startedAt);

  // 未来日時の場合はエラー
  if (started > now) {
    console.warn("startedAt is in the future");
    return null;
  }

  const diffMs = now.getTime() - started.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
  };
}

export function calculateStreakDays(elapsedSeconds: number): number {
  // 24時間ベース: 0〜<24h を0日目とする
  return Math.floor(elapsedSeconds / 86400);
}
```

**重要なポイント**:
- 未来日時の場合は `null` を返す（エラーハンドリング）
- 24時間ベースで日数を算出

## UIコンポーネント詳細

### StreakCounter コンポーネント

**ファイル**: `components/dashboard/streak-counter.tsx` (既存ファイルを拡張)

**主な変更点**:

1. **Props の追加**:
```typescript
interface StreakCounterProps {
  currentStreak: number;
  maxStreak: number;
  startedAt: Date | null; // ← 追加
}
```

2. **未開始状態の表示**:
```typescript
if (!startedAt) {
  return (
    <Card>
      <CardContent>
        <p>まだ開始していません</p>
      </CardContent>
    </Card>
  );
}
```

3. **リアルタイム更新**:
```typescript
const [elapsed, setElapsed] = useState<ElapsedTime | null>(null);

useEffect(() => {
  if (!startedAt) return;

  const updateElapsed = () => {
    const elapsedTime = calculateElapsedTime(startedAt);
    setElapsed(elapsedTime);
  };

  updateElapsed(); // 初回実行
  const interval = setInterval(updateElapsed, 1000);

  return () => clearInterval(interval); // クリーンアップ
}, [startedAt]);
```

4. **表示フォーマット**:
```typescript
// 開始日時: 2025/12/27 21:30
const startDateStr = startedAt.toLocaleString("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

// 経過時間: 3日 12:34:56
const elapsedStr = elapsed
  ? `${elapsed.days}日 ${String(elapsed.hours).padStart(2, "0")}:${String(elapsed.minutes).padStart(2, "0")}:${String(elapsed.seconds).padStart(2, "0")}`
  : "計算中...";

// ストリーク日数: 4日目
const streakDays = elapsed ? calculateStreakDays(elapsed.totalSeconds) : 0;
```

### StartStreakButton コンポーネント

**ファイル**: `components/dashboard/start-streak-button.tsx` (新規作成)

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { startStreak } from "@/app/actions/streak";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

export function StartStreakButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStart = () => {
    startTransition(async () => {
      try {
        const result = await startStreak();
        if (result.success) {
          if (result.alreadyStarted) {
            toast.info("既に開始済みです");
          } else {
            toast.success("オナ禁を開始しました！");
            router.refresh(); // ページをリフレッシュしてタイマー表示へ
          }
        }
      } catch (error) {
        console.error("Failed to start streak:", error);
        toast.error("開始に失敗しました");
      }
    });
  };

  return (
    <Button
      onClick={handleStart}
      disabled={isPending}
      className="w-full h-24 flex-col gap-2"
      size="lg"
    >
      <Play className="h-8 w-8" />
      <span className="font-bold">オナ禁スタート</span>
    </Button>
  );
}
```

## ダッシュボードページの更新

**ファイル**: `app/page.tsx` (既存ファイルを修正)

**主な変更点**:

1. **startedAt の取得**:
```typescript
const streakData = await db.query.streaks.findFirst({
  where: eq(streaks.userId, userId),
});

const startedAt = streakData?.startedAt || null;
```

2. **条件分岐での表示制御**:
```typescript
{!startedAt ? (
  <StartStreakButton />
) : (
  <StreakCounter
    currentStreak={userStreak.currentStreak}
    maxStreak={userStreak.maxStreak}
    startedAt={startedAt}
  />
)}
```

## エラーハンドリング・エッジケース

### 1. 未来日時の処理

```typescript
// calculateElapsedTime() 内で処理
if (started > now) {
  console.warn("startedAt is in the future");
  return null;
}
```

### 2. ブラウザバックグラウンド復帰時の再計算

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      // ページが表示されたら経過時間を再計算
      const elapsedTime = calculateElapsedTime(startedAt);
      setElapsed(elapsedTime);
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [startedAt]);
```

### 3. データ不整合の防御

```typescript
// startedAt = null だが currentStreak > 0 の場合
if (!startedAt && currentStreak > 0) {
  // 未開始として扱う（表示側で防御）
  return <StartStreakButton />;
}
```

## パフォーマンス最適化

### 1. 必要最小限の再レンダリング

```typescript
// useMemo で経過時間の文字列をメモ化
const elapsedStr = useMemo(() => {
  if (!elapsed) return "計算中...";
  return `${elapsed.days}日 ${String(elapsed.hours).padStart(2, "0")}:${String(elapsed.minutes).padStart(2, "0")}:${String(elapsed.seconds).padStart(2, "0")}`;
}, [elapsed]);
```

### 2. メモリリーク防止

```typescript
useEffect(() => {
  const interval = setInterval(updateElapsed, 1000);
  return () => clearInterval(interval); // 必ずクリーンアップ
}, [startedAt]);
```

## テスト時の注意点

1. **タイムゾーン**: サーバーとクライアントのタイムゾーンが異なる場合の挙動を確認
2. **日付境界**: 24時間ベースの日数計算が正しく動作するか確認
3. **複数タブ**: 複数タブで開いた場合の同期を確認
4. **バックグラウンド**: ブラウザがバックグラウンドになった場合の挙動を確認

## 既存コードとの統合ポイント

### 既存の `currentStreak` との関係

- **表示**: 開始日時から算出した値を優先
- **DB**: `currentStreak` は互換性のため保持（必要に応じて更新）
- **移行**: 既存ユーザーは `startedAt` が存在すればそれを利用

### 既存の `recordDay()` との関係

- **成功時**: 開始日時は変更しない（自動カウントのため）
- **失敗時**: `startedAt = null` を設定してタイマーを停止
- **日記**: 日記記録は従来通り動作（ログ目的）

## 参考リンク

- 要件定義書: `docs/streak_timer_requirements.md`
- 実装計画書: `docs/streak_timer_implementation_plan.md`
- タスク管理: `docs/streak_timer_tasks.md`

