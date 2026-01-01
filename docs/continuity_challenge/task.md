# 継続チャレンジ（習慣チェック）機能 - タスクリスト

## 概要
習慣化の仕組みを追加し、30日連続達成で次の習慣枠が解放される継続チャレンジ機能を実装する。

---

## Phase 1: データベース設計・マイグレーション
- [x] `user_habit_progress` テーブルのスキーマ定義を追加
- [x] `habits` テーブルのスキーマ定義を追加
- [x] `habit_checks` テーブルのスキーマ定義を追加
- [x] Drizzle マイグレーションを生成・適用

---

## Phase 2: Server Actions（バックエンドロジック）
- [x] `app/actions/continuity-challenge.ts` を新規作成
- [x] `getHabitProgress()` - ユーザーの習慣進捗・枠解放状態を取得
- [x] `getActiveHabits()` - 継続中の習慣一覧を取得
- [x] `createHabit(name)` - 新規習慣を作成（枠チェック付き）
- [x] `checkHabit(habitId, isYesterday)` - 当日/前日のチェック記録
- [x] `uncheckHabit(habitId, isYesterday)` - チェック解除
- [x] `archiveHabit(habitId)` - 習慣をアーカイブ
- [x] `updateHabit(habitId, name)` - 習慣名の更新
- [x] `calculateStreak(habitId)` - 連続日数の計算ロジック
- [x] `handleAchievement(habitId)` - 30日達成時の枠解放処理

---

## Phase 3: フロントエンド（継続チャレンジ画面）
- [x] `app/(dashboard)/continuity-challenge/page.tsx` を新規作成
- [x] 習慣一覧カード表示コンポーネント
- [x] ワンタップチェックインターフェース
- [x] 昨日分後付けチェック UI
- [x] 進捗バー（最新習慣用: 例 12/30）
- [x] 連続日数表示
- [x] 新規習慣追加モーダル/フォーム
- [x] 達成演出（30日達成時の祝福アニメーション）

---

## Phase 4: ナビゲーション統合
- [x] モテスコア画面から継続チャレンジへの導線追加
- [x] 継続チャレンジから今日の振り返りへの導線追加
- [x] スキップ機能の実装

---

## Phase 5: テスト・検証
- [x] 連続日数計算ロジックのユニットテスト
- [x] 後付けチェック期限切れのエッジケーステスト
- [x] 30日達成による枠解放テスト
- [x] JST日付境界での動作確認
- [x] E2E手動テスト（全フロー通し確認）

---

## 参照ドキュメント
- [要件定義書](file:///d:/Dev/nofap-ai/docs/FeatureSpec_ContinuityChallenge_HabitCheck_EN.md.md)
- [実装計画書](file:///d:/Dev/nofap-ai/docs/continuity_challenge/implementation_plan.md)
