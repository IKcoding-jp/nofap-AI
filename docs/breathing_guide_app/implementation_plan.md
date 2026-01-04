# 呼吸ガイドアプリ実装計画

視覚的な呼吸ガイド（円の拡大・縮小）を用いて、ユーザーが深呼吸を実践できるアプリを既存プロジェクトに追加する。

---

## ユーザー確認事項

> [!IMPORTANT]
> **既存機能との関係について**
> 現在 `/tools` ページに簡易的な「深呼吸モード」が存在します。この新機能は独立したページ `/breathing` として実装し、より高機能な呼吸ガイドを提供します。既存のtoolsページからもリンクを追加する予定です。

> [!IMPORTANT]
> **サウンド機能について**
> 要件にはガイド音声（「吸って」「吐いて」）と環境音（波、雨、森）がありますが、音声ファイルの用意が必要です。以下の選択肢があります：
> 1. **音声なしで実装** - 視覚ガイドのみ（推奨：まず動作確認後に音声追加）
> 2. **フリー素材を使用** - 著作権フリーの環境音を組み込み
> 
> どちらが良いですか？

---

## 提案する変更

### コンポーネント構成

#### [NEW] [breathing-session.tsx](file:///d:/Dev/nofap-ai/components/breathing/breathing-session.tsx)
メインの呼吸セッション画面コンポーネント
- 円の拡大/縮小アニメーション（Framer Motion）
- テキストガイド表示（「吸って」「止めて」「吐いて」）
- 残り時間表示
- 開始/一時停止/終了ボタン

#### [NEW] [breathing-settings.tsx](file:///d:/Dev/nofap-ai/components/breathing/breathing-settings.tsx)
設定画面コンポーネント
- プリセット選択（リラックス4-7-8、集中、カスタム）
- 秒数カスタマイズスライダー
- テーマ選択（複数カラーパレット）
- サウンド設定トグル

#### [NEW] [breathing-presets.ts](file:///d:/Dev/nofap-ai/lib/breathing-presets.ts)
呼吸パターンのプリセット定義
```typescript
export const breathingPresets = {
  relax: { name: "リラックス（4-7-8法）", inhale: 4, hold: 7, exhale: 8 },
  focus: { name: "集中", inhale: 4, hold: 4, exhale: 4 },
  calm: { name: "落ち着き", inhale: 5, hold: 2, exhale: 5 },
  energize: { name: "活力", inhale: 3, hold: 0, exhale: 3 },
};
```

---

### ページ

#### [NEW] [page.tsx](file:///d:/Dev/nofap-ai/app/(dashboard)/breathing/page.tsx)
呼吸ガイドのメインページ
- 認証チェック
- セッションと設定の切り替えタブ
- レスポンシブレイアウト

---

### ナビゲーション更新

#### [MODIFY] [page.tsx](file:///d:/Dev/nofap-ai/app/(dashboard)/tools/page.tsx)
ツールページに呼吸ガイドへのリンクを追加

#### [MODIFY] [page.tsx](file:///d:/Dev/nofap-ai/app/page.tsx)
ホームページのヘッダーに呼吸ガイドへのクイックアクセスボタンを追加

---

### スタイル

#### [MODIFY] [globals.css](file:///d:/Dev/nofap-ai/app/globals.css)
呼吸ガイド用のテーマカラーパレット追加
```css
:root {
  --breathing-calm: oklch(0.7 0.15 220);    /* 青系 */
  --breathing-warm: oklch(0.7 0.15 30);     /* オレンジ系 */
  --breathing-nature: oklch(0.65 0.15 140); /* 緑系 */
  --breathing-sunset: oklch(0.65 0.2 340);  /* ピンク系 */
}
```

---

### データベース（履歴機能用・オプション）

#### [NEW] [breathing-sessions.ts](file:///d:/Dev/nofap-ai/schema/breathing-sessions.ts)
セッション履歴を保存するテーブル
```typescript
export const breathingSessions = sqliteTable("breathing_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  preset: text("preset").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
});
```

---

## 検証計画

### ブラウザテスト
1. `npm run dev` でローカルサーバー起動
2. `http://localhost:3000/breathing` にアクセス
3. 以下を確認：
   - 円の拡大/縮小アニメーションが滑らか
   - テキストガイドがフェーズに合わせて切り替わる
   - タイマーが正確にカウントダウン
   - 開始/一時停止/終了ボタンが正常に動作
   - 各プリセットで異なる秒数が適用される

### レスポンシブテスト
1. ブラウザの開発者ツールでモバイル表示に切り替え
2. iPhone SE (375px)、iPhone 12 (390px)、iPad (768px) で確認
3. 円が画面内に収まり、操作ボタンがタップしやすいサイズか確認

### オフラインテスト
1. ブラウザの開発者ツールでネットワークをオフラインに設定
2. 呼吸セッションが正常に動作することを確認
