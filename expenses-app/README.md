# Sample Sheet App (TypeScript)

Google Apps Script の発注フォームアプリケーション（TypeScript 版）

## 必要な環境

- Node.js (v14 以上)
- npm
- Google Apps Script プロジェクト

## セットアップ

### 1. 依存パッケージのインストール

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
npx clasp create --type webapp --title "Sample Sheet App"
```

#### 既存プロジェクトに接続する場合

`.clasp.json` に自分のプロジェクト ID を設定してください。

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "dist"
}
```

### 4. ビルド

```bash
npm run build
```

このコマンドで、`src/` ディレクトリの TypeScript ファイルが `dist/` ディレクトリにコンパイルされます。

## 開発ワークフロー

### TypeScript のコンパイル

```bash
npm run build
```

### 監視モード（自動コンパイル）

```bash
npm run watch
```

### Google Apps Script へデプロイ

```bash
npm run push
```

または、ビルドとプッシュを同時に：

```bash
npm run deploy
```

## プロジェクト構造

```
sample-sheet-app/
├── src/
│   ├── main.ts          # メインロジック（TypeScript）
│   ├── index.html       # フロントエンドHTML
│   └── javascript.html  # Alpine.js スクリプト
├── dist/                # ビルド後のファイル（GASにプッシュされる）
│   ├── main.js
│   ├── index.html
│   └── javascript.html
├── tsconfig.json        # TypeScript設定
├── package.json
├── .clasp.json          # Clasp設定
└── .claspignore         # プッシュ除外ファイル
```

## TypeScript の利点

- **型安全性**: コンパイル時にエラーを検出
- **補完機能**: エディタの補完が強力に
- **リファクタリング**: 安全なコード変更
- **ドキュメント**: 型情報が実質的なドキュメントに

## Google Apps Script 関数

### `setSpreadsheetId()`

スプレッドシート ID を設定（初回のみ実行）

### `doGet()`

Web アプリのエントリーポイント

### `getAllRecords(sheetName: string)`

指定シートから全レコードを取得

### `submitOrder(orderData: OrderData)`

発注データをスプレッドシートに保存

### `updateInventory(items: object)`

在庫を更新（オプション）

## 必要なスプレッドシート構成

### 「商品」シート

| 商品 ID | 商品名 | 単価 | 在庫数 |
| ------- | ------ | ---- | ------ |
| P001    | 商品 A | 1000 | 50     |
| P002    | 商品 B | 2000 | 30     |

### 「発注履歴」シート

自動作成されます。

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
