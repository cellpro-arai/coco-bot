# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Google Apps Script expense management web application built with:
- **Backend**: TypeScript compiled to Google Apps Script (GAS)
- **Frontend**: React (aliased to Preact) with TypeScript, bundled with Vite
- **Deployment**: Uses `@google/clasp` to deploy to Google Apps Script

The app allows users to submit expense reports including commute expenses and general expenses with receipt uploads. It integrates with Google Drive for file storage and Google Sheets for data management.

## Project Structure

```
expenses-app/
├── backend/                 # GAS backend (TypeScript)
│   ├── src/
│   │   ├── main.ts         # Entry point: doGet(), submitExpense()
│   │   ├── drive.ts        # Google Drive file operations
│   │   ├── utils.ts        # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   ├── expenseManagement/  # Management spreadsheet operations
│   │   └── expenseReport/      # Report generation logic
│   ├── vite.config.ts      # Builds to Code.gs
│   └── package.json
├── frontend/               # React/Preact UI (TypeScript)
│   ├── src/
│   │   ├── main.tsx        # React entry point
│   │   ├── index.html      # HTML template
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API layer (google.script.run)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── vite.config.ts      # Builds to index.html (single file)
│   └── package.json
├── dist/                   # Build output (deployed to GAS)
│   ├── Code.gs            # Compiled backend
│   ├── index.html         # Bundled frontend
│   └── appsscript.json    # GAS manifest
├── appsscript.json        # GAS configuration template
├── .clasp.json            # Clasp deployment config (gitignored)
└── package.json           # Workspace root
```

## Development Commands

This is a monorepo using npm workspaces. All commands should be run from the **expenses-app root directory**.

### Build Commands

```bash
# Build both backend and frontend
npm run build

# Build backend only
npm run build --workspace backend

# Build frontend only
npm run build --workspace frontend
```

### Development Commands

```bash
# Run frontend dev server (with Vite HMR)
npm run dev

# Preview built frontend
npm run preview
```

### Deployment Commands

```bash
# Build and deploy to Google Apps Script
npm run push

# Deploy (builds first, then deploys)
npm run deploy
```

### Formatting

```bash
# Format backend code
npm run format --workspace backend

# Format frontend code
npm run format --workspace frontend
```

## Architecture

### Backend Build Process

1. TypeScript files in `backend/src/` are compiled by Vite
2. Output is bundled into `dist/Code.gs` (ES module format, unminified)
3. `appsscript.json` is copied to `dist/`
4. Global functions are exposed via `window.doGet` and `window.submitExpense` for GAS

**Key Backend Functions:**
- `doGet()`: Serves the HTML interface
- `submitExpense(expenseData)`: Processes expense submission, uploads files to Drive, creates expense reports

### Frontend Build Process

1. React/Preact components in `frontend/src/` are compiled by Vite
2. Vite uses `vite-plugin-singlefile` to bundle everything into a single `dist/index.html`
3. React is aliased to Preact for smaller bundle size
4. All assets (CSS, JS) are inlined into the HTML file

**Frontend-Backend Communication:**
- Uses `google.script.run` API to call GAS backend functions
- `apiService.ts` provides Promise-based wrapper
- Includes development mode mock for local testing (when `google` object is undefined)

### TypeScript Configuration

**Backend** (`backend/tsconfig.json`):
- Target: ES2019
- Strict mode enabled
- Outputs to `../dist/`
- Preserves comments for debugging

**Frontend** (`frontend/tsconfig.json`):
- Target: ESNext
- JSX: react-jsx
- Module resolution: bundler
- Type checking only (no emit - Vite handles compilation)

## Google Apps Script Configuration

The `appsscript.json` configures:
- **Time zone**: Asia/Tokyo
- **Runtime**: V8
- **Web app access**: MYSELF (deploy with USER_DEPLOYING)
- **Advanced services**: Drive API v3
- **OAuth scopes**: Spreadsheets, Drive, UserInfo, Container UI, External Requests

## Deployment Setup

1. **Initial clasp authentication** (one-time):
   ```bash
   npx clasp login
   ```

2. **Configure `.clasp.json`** with your script ID:
   ```json
   {
     "scriptId": "YOUR_SCRIPT_ID_HERE",
     "rootDir": "dist"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

## Key Integration Points

- **Drive Integration**: Files are uploaded via `uploadFileToDrive()` in `backend/src/drive.ts`
- **Sheet Integration**: Expense data is saved to management spreadsheet and individual expense report spreadsheets
- **Frontend State**: Custom hooks (`useExpenseEntries`, `useCommuteEntries`) manage form state
- **File Uploads**: Base64-encoded files are passed from frontend to backend for Drive upload
