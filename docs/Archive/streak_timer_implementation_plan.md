# ストリーク自動カウント機能 実装計画書

## 概要

要件定義書 (`streak_timer_requirements.md`) に基づき、開始日時ベースの自動カウント機能を実装する。

## 設計決定（未確定事項の仮決定）

開発を進めるため、以下の仮決定を行います：

1. **日数の定義**: **24時間ベース**を採用
   - `days = floor(elapsedSeconds / 86400)`
   - 0〜24時間は「0日目」、24時間経過で「1日目」となる方式を採用
   - シンプルで実装しやすく、ユーザーも理解しやすい

2. **失敗時の挙動**: **即停止して未開始に戻す**
   - 失敗記録時に `startedAt = null` に設定
   - 再スタートで新しい開始日時を確定

3. **開始操作**: **案A（明示的なスタートボタン）**を採用
   - 未開始状態で「オナ禁スタート」ボタンを表示
   - 押下で開始日時を確定

4. **開始日時の手動指定**: **不要**
   - 改ざん防止のため、操作時の現在時刻のみを採用

5. **「今日も成功！」の役割**: **日記/振り返り目的として残す（方針A）**
   - ストリーク表示は開始日時ベースで自動計算
   - ボタンは日記記録・ログ目的で継続利用

6. **DBの扱い**: **案1（表示値は算出、DBは互換のため温存）**
   - `currentStreak` は必要に応じて更新（後方互換性のため）
   - 表示は開始日時から算出した値を優先

## 実装フェーズ

### Phase 1: サーバーアクション（開始日時確定・リセット）

#### 1.1 開始日時確定アクションの作成
- **ファイル**: `app/actions/streak.ts` (新規作成)
- **関数**: `startStreak()`
  - 既に `startedAt` が存在する場合は何もしない（ガード）
  - 存在しない場合のみ `new Date()` で開始日時を設定
  - `currentStreak` は1に初期化（互換性のため）

#### 1.2 既存アクションの調整
- **ファイル**: `app/actions/records.ts`
  - `recordDay()` 関数内で、失敗時 (`status === "failure"`) に `startedAt = null` を設定
  - 成功時は開始日時の更新を行わない（既存のロジックを維持）

#### 1.3 リセットアクションの確認
- **ファイル**: `app/actions/reset.ts`
  - 既に `startedAt = null` を設定しているか確認（既存実装でOK）

### Phase 2: クライアント側ユーティリティ（経過時間計算）

#### 2.1 経過時間計算関数の作成
- **ファイル**: `lib/streak-timer.ts` (新規作成)
- **関数**:
  - `calculateElapsedTime(startedAt: Date | null): ElapsedTime | null`
    - 開始日時から現在時刻までの経過時間を計算
    - 日・時・分・秒を返す
  - `calculateStreakDays(elapsedSeconds: number): number`
    - 24時間ベースで日数を算出
    - `floor(elapsedSeconds / 86400) + 1`

#### 2.2 型定義
```typescript
interface ElapsedTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}
```

### Phase 3: UIコンポーネント（ストリーク表示・スタートボタン）

#### 3.1 StreakCounter コンポーネントの拡張
- **ファイル**: `components/dashboard/streak-counter.tsx`
- **変更内容**:
  - `startedAt` を props として受け取る
  - 未開始状態 (`startedAt === null`) の表示を追加
  - 開始日時の表示を追加
  - 経過時間（日・時・分・秒）のリアルタイム表示を追加
  - `useEffect` + `setInterval` で1秒間隔更新

#### 3.2 スタートボタンコンポーネントの作成
- **ファイル**: `components/dashboard/start-streak-button.tsx` (新規作成)
- **機能**:
  - 未開始状態でのみ表示
  - 「オナ禁スタート」ボタン
  - 押下で `startStreak()` を呼び出し
  - 成功後は自動的にタイマー表示へ遷移

#### 3.3 ダッシュボードページの更新
- **ファイル**: `app/page.tsx`
- **変更内容**:
  - `streaks.startedAt` を取得して `StreakCounter` に渡す
  - 未開始状態の場合は `StartStreakButton` を表示
  - 開始済みの場合は `StreakCounter` を表示

### Phase 4: エラーハンドリング・エッジケース対応

#### 4.1 データ不整合の防御
- `startedAt` が未来日時の場合の処理
- `startedAt = null` だが `currentStreak > 0` の場合の処理
- ブラウザのバックグラウンド復帰時の時刻再計算

#### 4.2 パフォーマンス最適化
- 1秒更新時のレンダリング最適化（必要最小限のコンポーネントのみ更新）
- メモリリーク防止（`useEffect` のクリーンアップ）

## 実装順序（推奨）

1. **Phase 1**: サーバーアクション（開始日時確定・リセット）
2. **Phase 2**: クライアント側ユーティリティ（経過時間計算）
3. **Phase 3**: UIコンポーネント（ストリーク表示・スタートボタン）
4. **Phase 4**: エラーハンドリング・エッジケース対応

## テスト項目

### 機能テスト
- [ ] 未開始状態でスタートボタンが表示される
- [ ] スタートボタン押下で開始日時が保存される
- [ ] 開始後、経過時間が1秒間隔で更新される
- [ ] 開始日時の表示が正しい
- [ ] ストリーク日数の計算が正しい（24時間ベース）
- [ ] 失敗記録で開始日時が無効化される
- [ ] 再スタートで新しい開始日時が設定される
- [ ] 既に開始済みの場合、再度スタートしても開始日時が変更されない

### エッジケーステスト
- [ ] `startedAt` が未来日時の場合の処理
- [ ] ブラウザバックグラウンド復帰時の時刻再計算
- [ ] 複数タブで開いた場合の同期

### UI/UXテスト
- [ ] 未開始状態の表示が分かりやすい
- [ ] 経過時間の表示が読みやすい
- [ ] 1秒更新時のパフォーマンスが問題ない

## 関連ファイル一覧

### 新規作成
- `app/actions/streak.ts` - 開始日時確定アクション
- `lib/streak-timer.ts` - 経過時間計算ユーティリティ
- `components/dashboard/start-streak-button.tsx` - スタートボタン

### 修正
- `app/actions/records.ts` - 失敗時の開始日時リセット
- `components/dashboard/streak-counter.tsx` - 自動カウント表示対応
- `app/page.tsx` - 開始日時の取得と表示制御

### 参照のみ（変更なし）
- `app/actions/reset.ts` - リセット処理（既存実装でOK）
- `schema/index.ts` - スキーマ定義（変更不要）

