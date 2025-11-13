# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains two Google Apps Script applications:
- **coco-alert-app**: A spreadsheet data viewer (JavaScript)
- **coco-incident-app**: An order form application (TypeScript)

Both apps are deployed as web applications and interact with Google Sheets.

## Project Structure

```
coco-bot/
├── coco-alert-app/          # Spreadsheet viewer app (JavaScript)
│   ├── main.js              # Backend logic
│   ├── index.html           # Frontend UI
│   ├── appsscript.json      # GAS configuration
│   └── .clasp.json          # Clasp deployment config
└── coco-incident-app/       # Order form app (TypeScript)
    ├── src/                 # Source files
    │   ├── main.ts          # Backend logic (TypeScript)
    │   └── index.html       # Frontend UI with Alpine.js
    ├── dist/                # Compiled output (deployed to GAS)
    ├── tsconfig.json        # TypeScript configuration
    ├── package.json         # npm dependencies
    └── .clasp.json          # Clasp deployment config
```

## Development Commands

### coco-incident-app (TypeScript)

```bash
# Navigate to the app directory
cd coco-incident-app

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Watch mode (auto-compile on file changes)
npm run watch

# Deploy to Google Apps Script
npm run push

# Build and deploy in one command
npm run deploy
```

### coco-alert-app (JavaScript)

This app uses plain JavaScript and doesn't require a build step. Deploy directly using clasp:

```bash
cd coco-alert-app
npx clasp push
```

## Architecture

### coco-incident-app (Order Form)

**Backend (main.ts):**
- `doGet()`: Entry point that serves the HTML interface
- `getAllRecords(sheetName)`: Fetches all records from a specified Google Sheet
- `submitOrder(orderData)`: Processes and saves order data to the "発注履歴" sheet
- `updateInventory(items)`: Optional function to update product inventory
- `setSpreadsheetId()`: One-time setup to configure the target spreadsheet

**Frontend (index.html):**
- Uses Alpine.js for reactive UI components
- `orderForm()` component manages form state, loading, validation, and submission
- Communicates with backend via `google.script.run` API
- Displays product list, calculates totals, and handles form submission

**Key Integration Points:**
- Spreadsheet ID is stored in Google Apps Script Properties Service
- Frontend calls backend functions asynchronously using `google.script.run`
- Error handling flows from backend exceptions to frontend error display

**Required Sheets:**
- "商品" (Products): Columns are 商品ID, 商品名, 単価, 在庫数
- "発注履歴" (Order History): Auto-created on first order

### coco-alert-app (Data Viewer)

**Backend (main.js):**
- `doGet()`: Serves the HTML interface
- `getSpreadsheetData()`: Retrieves data from configured spreadsheet or creates a new one
- `initializeSheet()`: Sets up sample data with headers

**Frontend (index.html):**
- Displays spreadsheet data in a table format
- Basic CRUD interface for viewing records

## TypeScript Configuration

The TypeScript project (coco-incident-app) compiles to ES2019/ES2020 with:
- Strict type checking enabled
- Output directory: `dist/`
- Source directory: `src/`
- Comments preserved in output for better debugging

## Deployment

Both apps use [@google/clasp](https://github.com/google/clasp) for deployment:

1. Authentication: `npx clasp login` (one-time setup)
2. Project linking: Configure `.clasp.json` with your script ID
3. Deploy: `npx clasp push` (or `npm run push` for TypeScript app)

**Important:** The `.clasp.json` file is gitignored and contains sensitive script IDs.

## Google Apps Script Configuration

Both apps have `appsscript.json` files with:
- Time zone: Asia/Tokyo
- Runtime: V8
- Web app access configured (ANYONE_ANONYMOUS or MYSELF)
