# ダッシュボードの2カラムレイアウト化

PC（デスクトップ）表示において、画面の横幅を有効活用するためにダッシュボードを2カラムのレイアウトに変更します。

## Proposed Changes

### [Dashboard Area]

#### [MODIFY] [page.tsx](file:///d:/Dev/nofap-ai/app/page.tsx)

- 全体のコンテナサイズを `max-w-2xl` から `lg:max-w-6xl` に拡張します。
- メイングリッドを `lg:grid-cols-3` (または `lg:grid-cols-2`) に変更します。
- セクションの配置を以下のように調整します：
    - **左側 (メインカラム)**: `StreakCounter` (または `StartStreakButton`), `ContinuityChallengeSection`
    - **右側 (サイドカラム)**: `RecordSection`, クイックリンク集
- 各セクション間の余白 (`gap`) を調整し、デスクトップで見栄えが良くなるようにします。

## Verification Plan

### Automated Tests
- `npm run dev` で開発サーバーを起動し、ブラウザで表示を確認します。

### Manual Verification
- ブラウザのデベロッパーツールを使用して、以下の画面幅での表示を確認します。
    - モバイル (375px程度): 従来通りの1カラム表示が維持されていること。
    - タブレット (768px程度): レイアウトが崩れていないこと。
    - デスクトップ (1024px以上): 2カラムレイアウトになり、情報が整理されていること。
- 各ボタンやフォームの操作性が損なわれていないか確認します。
