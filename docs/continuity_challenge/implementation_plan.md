# 継続チャレンジ（習慣チェック）機能 - 実装計画書

## 目的
既存の「モテスコア → 今日の振り返り」フローに習慣チェック機能を追加し、30日連続達成で習慣枠が解放されるゲーミフィケーション要素を実装する。

---

## 技術スタック
- **フレームワーク**: Next.js 14 (App Router)
- **ORM**: Drizzle ORM
- **データベース**: SQLite (Turso)
- **認証**: BetterAuth
- **UI**: React + CSS

---

## 変更予定

### データベース層

---

#### [NEW] [index.ts](file:///d:/Dev/nofap-ai/schema/index.ts) に追加するテーブル

##### 1. `userHabitProgress` テーブル
ユーザーごとの習慣解放状態を管理。

```typescript
export const userHabitProgress = sqliteTable("user_habit_progress", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  unlockedSlots: integer("unlocked_slots").notNull().default(1),
  currentChallengeHabitId: integer("current_challenge_habit_id"),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
```

##### 2. `habits` テーブル
習慣の定義と進捗状態を管理。

```typescript
export const habits = sqliteTable("habits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status", { 
    enum: ["challenge", "maintenance", "archived"] 
  }).notNull().default("challenge"),
  sortOrder: integer("sort_order").notNull().default(0),
  challengeStartedOn: text("challenge_started_on"), // ISO date: YYYY-MM-DD
  challengeCompletedOn: text("challenge_completed_on"), // nullable
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalChecks: integer("total_checks").notNull().default(0),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

##### 3. `habitChecks` テーブル
日次チェック記録を管理。

```typescript
export const habitChecks = sqliteTable("habit_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  habitId: integer("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  checkDate: text("check_date").notNull(), // ISO date: YYYY-MM-DD (JST)
  checkedAt: integer("checked_at", { mode: "timestamp" }).notNull(),
  source: text("source", { 
    enum: ["same_day", "backfill_yesterday"] 
  }).notNull().default("same_day"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

> [!IMPORTANT]
> `habitChecks` に UNIQUE(habitId, checkDate) 制約を追加して日付重複を防ぐ。

---

### Server Actions層

---

#### [NEW] [continuity-challenge.ts](file:///d:/Dev/nofap-ai/app/actions/continuity-challenge.ts)

継続チャレンジ機能のバックエンドロジックを実装。

| 関数名 | 説明 |
|--------|------|
| `getHabitProgress()` | ユーザーの習慣進捗・解放枠数を取得 |
| `getActiveHabits()` | 継続中(status != archived)の習慣一覧を取得 |
| `createHabit(name)` | 新規習慣を作成（枠チェック付き） |
| `checkHabit(habitId, isYesterday?)` | 当日/前日のチェックを記録 |
| `uncheckHabit(habitId, isYesterday?)` | チェックを解除 |
| `archiveHabit(habitId)` | 習慣をアーカイブ（非表示化） |
| `updateHabit(habitId, name)` | 習慣名を更新 |

##### 連続日数計算ロジック

```typescript
// JST日付を取得
function getJstToday(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split("T")[0];
}

// 連続日数を計算
async function calculateStreak(habitId: number): Promise<number> {
  const checks = await db.query.habitChecks.findMany({
    where: eq(habitChecks.habitId, habitId),
    orderBy: [desc(habitChecks.checkDate)],
  });
  
  if (checks.length === 0) return 0;
  
  const today = getJstToday();
  const yesterday = getYesterday(today);
  
  // 最新チェックが今日か昨日でなければストリークは0
  if (checks[0].checkDate !== today && checks[0].checkDate !== yesterday) {
    return 0;
  }
  
  let streak = 0;
  let expectedDate = checks[0].checkDate;
  
  for (const check of checks) {
    if (check.checkDate === expectedDate) {
      streak++;
      expectedDate = getPreviousDate(expectedDate);
    } else {
      break;
    }
  }
  
  return streak;
}
```

##### 30日達成処理

```typescript
async function handleAchievement(habitId: number): Promise<boolean> {
  const habit = await db.query.habits.findFirst({
    where: eq(habits.id, habitId),
  });
  
  if (!habit || habit.currentStreak < 30) return false;
  
  // user_habit_progressの枠を +1
  await db.update(userHabitProgress)
    .set({
      unlockedSlots: sql`unlocked_slots + 1`,
      currentChallengeHabitId: null,
      updatedAt: new Date(),
    })
    .where(eq(userHabitProgress.userId, habit.userId));
  
  // 習慣ステータスを maintenance に変更
  await db.update(habits)
    .set({
      status: "maintenance",
      challengeCompletedOn: getJstToday(),
      updatedAt: new Date(),
    })
    .where(eq(habits.id, habitId));
  
  return true;
}
```

---

### フロントエンド層

---

#### [NEW] [page.tsx](file:///d:/Dev/nofap-ai/app/(dashboard)/continuity-challenge/page.tsx)

継続チャレンジのメイン画面。

**UI構成:**
1. 継続中習慣リスト（カード形式）
   - 習慣名
   - チェックボタン（ワンタップ）
   - 連続日数バッジ
   - 最新習慣のみ進捗バー（例: 12/30）

2. 昨日分後付けセクション
   - 昨日未チェックの習慣を表示
   - JST 23:59まで編集可能

3. 新規習慣追加ボタン
   - 最新習慣が30日達成済みの場合のみアクティブ

4. 達成演出
   - 30日達成時に祝福モーダル表示
   - コンフェッティアニメーション

---

#### [NEW] [HabitCard.tsx](file:///d:/Dev/nofap-ai/components/continuity-challenge/HabitCard.tsx)

習慣カードコンポーネント。

```tsx
interface HabitCardProps {
  habit: Habit;
  isLatest: boolean; // 最新習慣かどうか
  todayChecked: boolean;
  yesterdayChecked: boolean | null; // null = 後付け不可（期限切れ）
  onCheck: (isYesterday: boolean) => void;
  onUncheck: (isYesterday: boolean) => void;
}
```

---

### ナビゲーション統合

---

#### [MODIFY] [page.tsx](file:///d:/Dev/nofap-ai/app/page.tsx)

ホーム画面（モテスコア画面）に継続チャレンジへの導線を追加。

```diff
+ // モテスコア完了後に継続チャレンジへ誘導
+ <Link href="/continuity-challenge" className="next-step-button">
+   継続チャレンジへ
+ </Link>
```

---

## 検証計画

### 自動テスト

現時点でプロジェクト内にテストフレームワークが設定されていないため、以下の手動テストで検証する。

### 手動テスト

#### テスト1: 初期状態の確認
1. 新規ユーザーでログイン
2. `/continuity-challenge` へアクセス
3. **期待結果**: 習慣0件、「最初の習慣を追加」ボタンが表示される

#### テスト2: 習慣作成と日次チェック
1. 「習慣を追加」から習慣名を入力して作成
2. 作成された習慣カードが表示されることを確認
3. チェックボタンをタップ
4. **期待結果**: 連続日数が「1日」と表示される

#### テスト3: 後付けチェック
1. 当日のチェックを行う
2. 「昨日分をチェック」セクションを確認
3. 昨日分をチェック
4. **期待結果**: 連続日数が+1される（source=backfill_yesterday）

#### テスト4: 2件目の習慣追加制限
1. 最初の習慣が30日達成前の状態で
2. 「習慣を追加」ボタンを確認
3. **期待結果**: ボタンが非活性（disabled）または非表示

#### テスト5: 30日達成と枠解放
1. DBで直接 `current_streak` を29に設定
2. 当日チェックを実行
3. **期待結果**: 
   - 達成演出が表示される
   - `unlocked_slots` が2になる
   - 2件目の習慣追加が可能になる

#### テスト6: JST日付境界の確認
1. ブラウザのタイムゾーンをUTCに変更
2. チェック操作を実行
3. **期待結果**: チェック日付がJSTで記録される（UTCではない）

---

## リスク・注意点

> [!WARNING]
> 既存の `userHabits` テーブルは別目的（筋トレ/清潔感の日次カウンター）で使用中。
> 新機能では新規テーブル（`habits`, `habitChecks`）を使用し、既存機能に影響を与えない。

> [!CAUTION]
> JST固定の日付判定を徹底する。サーバー側での日付計算は `+09:00` オフセットを明示的に適用すること。

---

## タイムライン（目安）

| Phase | 内容 | 工数 |
|-------|------|------|
| 1 | DB設計・マイグレーション | 1-2時間 |
| 2 | Server Actions実装 | 3-4時間 |
| 3 | フロントエンド実装 | 4-6時間 |
| 4 | ナビゲーション統合 | 1時間 |
| 5 | テスト・検証 | 2時間 |

**合計: 約11-15時間**
