#!/bin/sh

echo "Vite + React + GAS(Google Apps Script) の構成を作成します。"

echo "npmプロジェクト初期化"
npm init -y
echo "TypeScriptのセットアップ中..."
npm i -D typescript
echo "Reactおよび関連タイプのインストール中..."
npm i -S react react-dom react-router
npm i -D @types/react @types/react-dom

echo "tsconfigファイルの作成中..."
cat <<EOF >tsconfig.backend.json  
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src/backend",
    "module": "commonjs",
    "target": "ESNext"
  },
  "include": ["src/backend/**/*"]
}
EOF

cat <<EOF >tsconfig.json
{
  "compilerOptions": {
    "jsx": "react",
    "target": "ES2019",
    "module": "ES2020",
    "lib": ["ES2019", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "sourceMap": false,
    "inlineSourceMap": false,
    "noUnusedParameters": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

echo "ViteおよびReactプラグインのインストール中..."
npm i -D vite @vitejs/plugin-react vite-plugin-singlefile

echo "vite.config.jsの作成中..."
cat <<EOF >vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: 'src',
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    sourcemap: true,
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
EOF

echo "プロジェクト構造の作成中..."
mkdir -p src/{frontend,backend}

cat <<EOF >src/index.html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vite + React + GAS</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/frontend/main.tsx"></script>
</body>
</html>
EOF

echo "サンプルReactファイルの作成中..."
cat <<EOF >src/frontend/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
const App = () => <h1>Hello, Vite + React + GAS!</h1>;
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
EOF

cat <<EOF >src/frontend/App.tsx
import React from 'react';
const App: React.FC = () => {
  return <div>My Vite + React + GAS App</div>;
};
export default App;
EOF

echo "GASタイプのインストール中..."
npm i -D @types/google-apps-script
npm i -D @google/clasp

echo "GAS用のserver.tsを作成中..."
cat <<EOF >src/backend/server.ts
function doGet() {
  return HtmlService.createHtmlOutputFromFile("index");
}
EOF

echo "セットアップ完了！これでVite + React + GASプロジェクトのビルドとデプロイが可能です。"
npm install

echo "package.jsonにスクリプトを設定中..."
npx npm-add-script -k "build:frontend" -v "vite build"
npx npm-add-script -k "build:backend" -v "tsc -p tsconfig.backend.json"
npx npm-add-script -k "watch" -v "vite"
npx npm-add-script -k "push" -v "npm run build:frontend && npm run build:backend && clasp push"

echo ".claspignoreの作成中..."
cat <<EOF >.claspignore
node_modules/**
src/**
vite.config.js
tsconfig.json
tsconfig.backend.json
package.json
package-lock.json
README.md
.gitignore
.vscode/
.idea/
*.map
dist/**/*.map
EOF

echo ".gitignoreの作成中..."
cat <<EOF >.gitignore
# Node modules
node_modules/

# Build output
dist/

# Clasp
.clasp.json

# Environment variables
.env

# Editor
.vscode/
.idea/
*.swp
*.swo
.DS_Store
EOF

cat <<EOF >README.md
# Vite + React + GAS Project

## セットアップ

1. 依存関係のインストール
   \`\`\`bash
   npm install
   \`\`\`
2. Claspの初期化
   \`\`\`bash
   npx clasp login
   npx clasp create --title "My Vite React GAS App"
   \`\`\`

## 開発環境起動

- 開発サーバーの起動
  \`\`\`bash
  npm run watch
  \`\`\`

## GASへのデプロイ

1. [Google Apps Script](https://script.google.com/)で新しいプロジェクトを作成し、\`.clasp.json\`の\`scriptId\`を更新します。
2. ビルドとサーバープッシュ
    \`\`\`bash
    npm run push
    \`\`\`
3. デプロイ
  - GASエディタで「公開」->「ウェブアプリケーションとして導入」を選択し、最新のコードをデプロイします。
    \`\`\`
    npx clasp list
    \`\`\`
4. ビルドとサーバープッシュ
    \`\`\`bash
    npm run push
    \`\`\`
5. デプロイ
  - GASエディタで「公開」->「ウェブアプリケーションとして導入」を選択し、最新のコードをデプロイします。
EOF


echo "全て完了しました！プロジェクトのルートディレクトリで 'npm run watch' を実行して開発を開始できます。"
