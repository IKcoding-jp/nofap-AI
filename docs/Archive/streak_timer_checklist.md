# ストリーク自動カウント機能 実装チェックリスト

## 実装前の確認

- [ ] 要件定義書 (`streak_timer_requirements.md`) を読んだ
- [ ] 実装計画書 (`streak_timer_implementation_plan.md`) を読んだ
- [ ] 技術詳細 (`streak_timer_technical_details.md`) を読んだ
- [ ] 既存コードの構造を理解した
  - [ ] `app/actions/records.ts` の `recordDay()` 関数
  - [ ] `components/dashboard/streak-counter.tsx` の構造
  - [ ] `app/page.tsx` のデータ取得方法
  - [ ] `schema/index.ts` の `streaks` テーブル定義

## Phase 1: サーバーアクション

### Task 1.1: 開始日時確定アクション
- [ ] `app/actions/streak.ts` を作成
- [ ] `startStreak()` 関数を実装
  - [ ] 認証チェック
  - [ ] 既存の `startedAt` チェック（ガード）
  - [ ] `streaks` テーブルへの開始日時設定
  - [ ] `currentStreak` を1に初期化
  - [ ] `revalidatePath("/")` でキャッシュクリア
- [ ] エラーハンドリング
- [ ] 動作確認（既存ユーザーで開始日時が設定される）

### Task 1.2: 既存アクションの調整
- [ ] `app/actions/records.ts` を開く
- [ ] `recordDay()` 関数内の失敗処理を確認
- [ ] `status === "failure"` の処理に `startedAt = null` を追加
- [ ] 動作確認（失敗記録で開始日時が無効化される）

### Task 1.3: リセットアクションの確認
- [ ] `app/actions/reset.ts` を確認
- [ ] `startedAt = null` が設定されていることを確認
- [ ] 問題なければそのまま（変更不要）

## Phase 2: クライアント側ユーティリティ

### Task 2.1: 経過時間計算関数
- [ ] `lib/streak-timer.ts` を作成
- [ ] `ElapsedTime` インターフェースを定義
- [ ] `calculateElapsedTime()` 関数を実装
  - [ ] `null` チェック
  - [ ] 未来日時のエラー処理
  - [ ] 日・時・分・秒の計算
- [ ] `calculateStreakDays()` 関数を実装
  - [ ] 24時間ベースの計算
- [ ] 動作確認（テストコードまたは手動テスト）

## Phase 3: UIコンポーネント

### Task 3.1: StreakCounter の拡張
- [ ] `components/dashboard/streak-counter.tsx` を開く
- [ ] Props に `startedAt: Date | null` を追加
- [ ] 未開始状態の表示を実装
- [ ] 開始済み状態の表示を実装
  - [ ] 開始日時の表示
  - [ ] 経過時間の表示
  - [ ] ストリーク日数の表示
- [ ] リアルタイム更新の実装
  - [ ] `useEffect` + `setInterval`
  - [ ] クリーンアップ処理
- [ ] スタイリングの調整
- [ ] 動作確認（1秒間隔で更新される）

### Task 3.2: スタートボタンの作成
- [ ] `components/dashboard/start-streak-button.tsx` を作成
- [ ] UI実装（ボタン）
- [ ] `startStreak()` アクションの呼び出し
- [ ] ローディング状態の表示
- [ ] 成功後の自動リロード
- [ ] エラーハンドリング
- [ ] 動作確認（押下で開始日時が設定される）

### Task 3.3: ダッシュボードページの更新
- [ ] `app/page.tsx` を開く
- [ ] `streaks.startedAt` を取得
- [ ] 条件分岐を追加
  - [ ] 未開始: `StartStreakButton` を表示
  - [ ] 開始済み: `StreakCounter` を表示
- [ ] `StreakCounter` に `startedAt` を渡す
- [ ] 動作確認（未開始/開始済みで正しく表示される）

## Phase 4: エラーハンドリング・エッジケース

### Task 4.1: データ不整合の防御
- [ ] 未来日時の処理を実装
- [ ] `startedAt = null` だが `currentStreak > 0` の処理
- [ ] ブラウザバックグラウンド復帰時の再計算
- [ ] 動作確認（各エッジケースで正しく動作する）

### Task 4.2: パフォーマンス最適化
- [ ] 必要最小限の再レンダリング（`useMemo` など）
- [ ] メモリリーク防止（クリーンアップ処理）
- [ ] 動作確認（パフォーマンスに問題がない）

## Phase 5: テスト・検証

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

## 実装完了後の確認

- [ ] すべてのタスクが完了している
- [ ] テストがすべてパスしている
- [ ] コードレビュー（セルフレビュー）を実施
- [ ] ドキュメントが最新であることを確認
- [ ] 既存機能に影響がないことを確認

## トラブルシューティング

### よくある問題

1. **経過時間が更新されない**
   - `useEffect` の依存配列を確認
   - クリーンアップ処理が正しく実装されているか確認

2. **開始日時が設定されない**
   - サーバーアクションの認証チェックを確認
   - DBへの書き込みが成功しているか確認

3. **パフォーマンスが悪い**
   - 不要な再レンダリングがないか確認
   - `useMemo` や `useCallback` を活用

4. **タイムゾーンの問題**
   - サーバーとクライアントのタイムゾーンを確認
   - `Date` オブジェクトの扱いに注意

## 参考ドキュメント

- 要件定義書: `docs/streak_timer_requirements.md`
- 実装計画書: `docs/streak_timer_implementation_plan.md`
- 技術詳細: `docs/streak_timer_technical_details.md`
- タスク管理: `docs/streak_timer_tasks.md`


