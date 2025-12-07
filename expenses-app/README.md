# 経費精算アプリ (Expenses App)

Google Apps Script で動作する経費精算 Web アプリケーション

## 概要

このアプリケーションは、経費精算報告（通勤費・一般経費）を管理するための Web アプリケーションです。

**技術スタック:**

- **バックエンド**: TypeScript → Google Apps Script (GAS)
- **フロントエンド**: React (Preact) + TypeScript、Vite でビルド
- **デプロイ**: `@google/clasp` を使用
- **ストレージ**: Google Drive (ファイル保存)、Google Sheets (データ管理)

**主な機能:**

- 通勤費・一般経費の入力フォーム
- 領収書のアップロード（Google Drive 保存）
- 経費精算書の自動生成（Google Sheets）
- 管理シートへの記録

## プロジェクト構成

```
expenses-app/
├── backend/                 # GAS バックエンド (TypeScript)
│   ├── src/
│   │   ├── main.ts         # エントリーポイント: doGet(), submitExpense()
│   │   ├── drive.ts        # Google Drive ファイル操作
│   │   ├── utils.ts        # ユーティリティ関数
│   │   ├── types/          # TypeScript 型定義
│   │   ├── expenseManagement/  # 管理シート操作
│   │   └── expenseReport/      # レポート生成ロジック
│   ├── vite.config.ts      # Code.gs にビルド
│   └── package.json
├── frontend/               # React/Preact UI (TypeScript)
│   ├── src/
│   │   ├── main.tsx        # React エントリーポイント
│   │   ├── index.html      # HTML テンプレート
│   │   ├── pages/          # ページコンポーネント
│   │   ├── components/     # 再利用可能なコンポーネント
│   │   ├── services/       # API レイヤー (google.script.run)
│   │   ├── hooks/          # カスタム React フック
│   │   ├── types/          # TypeScript 型定義
│   │   └── utils/          # ユーティリティ関数
│   ├── vite.config.ts      # index.html (単一ファイル) にビルド
│   └── package.json
├── dist/                   # ビルド出力 (GAS にデプロイされる)
│   ├── Code.gs            # コンパイル済みバックエンド
│   ├── index.html         # バンドル済みフロントエンド
│   └── appsscript.json    # GAS マニフェスト
├── appsscript.json        # GAS 設定テンプレート
├── .clasp.json            # Clasp デプロイ設定 (gitignore)
└── package.json           # ワークスペースルート
```

## 必要な環境

- Node.js (v14 以上)
- npm
- Google Apps Script プロジェクト
- Google アカウント

## セットアップ

### 1. 依存パッケージのインストール

このプロジェクトは npm ワークスペースを使用したモノレポです。**ルートディレクトリ** (`expenses-app/`) で実行してください。

```bash
npm install
```

### 2. clasp で Google アカウントにログイン

初回のみ、Google Apps Script にアクセスするための認証が必要です。

```bash
npx clasp login
```

ブラウザが開くので、Google アカウントでログインして clasp を認証してください。

### 3. Google Apps Script プロジェクトの設定

#### 新規プロジェクトを作成する場合

```bash
npx clasp create --type webapp --title "経費精算アプリ"
```

作成された `.clasp.json` の `rootDir` を `"dist"` に変更してください。

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "dist"
}
```

#### 既存プロジェクトに接続する場合

`.clasp.json` ファイルを作成し、スクリプト ID を設定してください。

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "dist"
}
```

## 開発コマンド

すべてのコマンドは **expenses-app ルートディレクトリ** から実行してください。

### ビルド

```bash
# バックエンド・フロントエンド両方をビルド
npm run build

# バックエンドのみビルド
npm run build --workspace backend

# フロントエンドのみビルド
npm run build --workspace frontend
```

### 開発

```bash
# フロントエンド開発サーバー起動 (Vite HMR)
npm run dev

# ビルド済みフロントエンドをプレビュー
npm run preview
```

### デプロイ

```bash
# ビルド & Google Apps Script へデプロイ
npm run deploy

# デプロイのみ (ビルド済みの場合)
npm run push
```

### コードフォーマット

```bash
# バックエンドをフォーマット
npm run format --workspace backend

# フロントエンドをフォーマット
npm run format --workspace frontend
```

## アーキテクチャ

### バックエンドビルドプロセス

1. `backend/src/` の TypeScript ファイルを Vite でコンパイル
2. `dist/Code.gs` に出力 (ES モジュール形式、非圧縮)
3. `appsscript.json` を `dist/` にコピー
4. `window.doGet` と `window.submitExpense` でグローバル関数を公開

**主要なバックエンド関数:**

- `doGet()`: HTML インターフェースを提供
- `submitExpense(expenseData)`: 経費精算を処理、Drive にアップロード、レポート作成

### フロントエンドビルドプロセス

1. `frontend/src/` の React/Preact コンポーネントを Vite でコンパイル
2. `vite-plugin-singlefile` で単一の `dist/index.html` にバンドル
3. React は Preact にエイリアス（バンドルサイズ削減）
4. CSS・JS をすべて HTML にインライン化

**フロントエンド - バックエンド通信:**

- `google.script.run` API で GAS バックエンド関数を呼び出し
- `apiService.ts` が Promise ベースのラッパーを提供
- 開発モード用のモック機能あり (`google` オブジェクト未定義時)

## Google Apps Script 設定

`appsscript.json` の設定内容:

- **タイムゾーン**: Asia/Tokyo
- **ランタイム**: V8
- **Web アプリアクセス**: MYSELF (USER_DEPLOYING でデプロイ)
- **高度なサービス**: Drive API v3
- **OAuth スコープ**: Spreadsheets, Drive, UserInfo, Container UI, External Requests

## 主要な統合ポイント

- **Drive 統合**: `backend/src/drive.ts` の `uploadFileToDrive()` でファイルアップロード
- **Sheets 統合**: 管理シートと個別の経費精算シートにデータ保存
- **フロントエンド状態管理**: カスタムフック (`useExpenseEntries`, `useCommuteEntries`) でフォーム状態を管理
- **ファイルアップロード**: Base64 エンコードされたファイルをフロントエンドからバックエンドに送信し、Drive にアップロード

## トラブルシューティング

### ビルドエラーが出る場合

```bash
npm install
npm run build
```

### 型エラーが出る場合

`@types/google-apps-script` パッケージがインストールされているか確認してください。

```bash
npm list @types/google-apps-script
```

### デプロイが失敗する場合

- `.clasp.json` のスクリプト ID が正しいか確認
- `clasp login` で認証が完了しているか確認
- `npm run build` でビルドが成功しているか確認

## ライセンス

内部使用のためのプロジェクトです。
