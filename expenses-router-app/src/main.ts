/**
 * ========================================
 * 経費精算フォーム
 * ========================================
 *
 * 【セットアップ手順】
 * 1. Google Apps Scriptで新規プロジェクトを作成
 * 2. このmain.tsとindex.htmlをプロジェクトに追加
 * 3. setSpreadsheetId()関数でスプレッドシートIDを設定
 * 4. setUploadFolderId()関数でGoogle DriveのフォルダIDを設定
 * 5. Webアプリとしてデプロイ（アクセス: 組織 *開発時は自分のみ）
 *
 * ========================================
 */

/**
 * ファイルデータの型定義
 */
interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded
}

/**
 * 経費精算データの型定義
 */
interface CommuteEntry {
  date: string;
  origin: string;
  destination: string;
  amount: string;
}

interface ExpenseEntry {
  description: string;
  amount: string;
  receiptFile: FileData;
}

interface ExpenseEntryRecord {
  description: string;
  amount: string;
  receiptUrl: string;
}

interface ExpenseData {
  name: string;
  workScheduleFile: FileData | null;
  workStartTime: string;
  workEndTime: string;
  hasCommuterPass: string;
  nearestStation: string;
  workStation: string;
  monthlyFee: string;
  remarks: string;
  commuteEntries: CommuteEntry[];
  expenseEntries: ExpenseEntry[];
}

/**
 * 経費精算登録結果の型定義
 */
interface ExpenseResult {
  success: boolean;
  message: string;
  submittedDate: string;
}

/**
 * スクリプトプロパティを取得する共通関数
 */
function getScriptProperty(propertyName: string, errorMessage: string): string {
  const scriptProperties = PropertiesService.getScriptProperties();
  const value = scriptProperties.getProperty(propertyName);

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

/**
 * ファイルをGoogle Driveにアップロード
 */
function uploadFileToDrive(fileData: FileData): string {
  const folderId = getScriptProperty(
    "UPLOAD_FOLDER_ID",
    "アップロード先のフォルダIDが設定されていません。"
  );
  const folder = DriveApp.getFolderById(folderId);
  const decodedData = Utilities.base64Decode(fileData.data);
  const blob = Utilities.newBlob(decodedData, fileData.mimeType, fileData.name);
  const file = folder.createFile(blob);

  return file.getUrl();
}

const EXPENSE_SHEET_NAME = "経費精算";
const EXPENSE_SHEET_HEADERS = [
  "提出日時",
  "提出者",
  "氏名",
  "勤務表",
  "交通費明細",
  "経費明細",
  "開始時間",
  "終了時間",
  "定期券購入",
  "最寄り駅",
  "勤務先の駅",
  "月額",
  "備考",
];
const USER_EXPENSE_SHEET_NAME = "提出履歴";
const USER_SPREADSHEET_PROPERTY_PREFIX = "USER_SPREADSHEET_";
const USER_SPREADSHEET_NAME_PREFIX = "経費精算_";

function ensureExpenseSheetHeader(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): void {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(EXPENSE_SHEET_HEADERS);
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, EXPENSE_SHEET_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsUpdate = EXPENSE_SHEET_HEADERS.some(
    (header, index) => currentHeaders[index] !== header
  );

  if (needsUpdate) {
    headerRange.setValues([EXPENSE_SHEET_HEADERS]);
  }
}

function setFileHyperlink(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  row: number,
  column: number,
  fileName?: string,
  url?: string
): void {
  if (!fileName || !url) {
    return;
  }

  const richTextBuilder = SpreadsheetApp.newRichTextValue()
    .setText(fileName)
    .setLinkUrl(url);
  sheet.getRange(row, column).setRichTextValue(richTextBuilder.build());
}

function formatCommuteEntries(entries: CommuteEntry[]): string {
  if (!entries || entries.length === 0) {
    return "";
  }

  return entries
    .map((entry, index) => {
      const amountText = entry.amount ? `${entry.amount}円` : "";
      const parts = [
        `${index + 1}.`,
        entry.date,
        `${entry.origin}→${entry.destination}`,
        amountText,
      ].filter(Boolean);

      return parts.join(" ");
    })
    .join("\n");
}

function uploadExpenseReceipts(entries: ExpenseEntry[]): ExpenseEntryRecord[] {
  if (!entries || entries.length === 0) {
    return [];
  }

  return entries.map((entry) => ({
    description: entry.description,
    amount: entry.amount,
    receiptUrl: uploadFileToDrive(entry.receiptFile),
  }));
}

function formatExpenseEntries(entries: ExpenseEntryRecord[]): string {
  if (!entries || entries.length === 0) {
    return "";
  }

  return entries
    .map((entry, index) => {
      const base = `${index + 1}. ${entry.description}（${entry.amount}円）`;
      return entry.receiptUrl ? `${base}\n領収書: ${entry.receiptUrl}` : base;
    })
    .join("\n\n");
}

/**
 * 経費精算シートを取得または作成
 */
function getOrCreateExpenseSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = spreadsheet.getSheetByName(EXPENSE_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(EXPENSE_SHEET_NAME);
  }

  ensureExpenseSheetHeader(sheet);
  return sheet;
}

function getUserSpreadsheetPropertyKey(userEmail: string): string {
  return `${USER_SPREADSHEET_PROPERTY_PREFIX}${userEmail}`;
}

function getOrCreateUserSpreadsheet(
  userEmail: string,
  userName: string
): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const scriptProperties = PropertiesService.getScriptProperties();
  const propertyKey = getUserSpreadsheetPropertyKey(userEmail);
  const existingId = scriptProperties.getProperty(propertyKey);

  if (existingId) {
    try {
      return SpreadsheetApp.openById(existingId);
    } catch (error) {
      console.warn(
        `ユーザー(${userEmail})のスプレッドシート取得に失敗しました。再作成します。`,
        error
      );
      scriptProperties.deleteProperty(propertyKey);
    }
  }

  const spreadsheetName = `${USER_SPREADSHEET_NAME_PREFIX}${
    userName || userEmail
  }`;
  const userSpreadsheet = SpreadsheetApp.create(spreadsheetName);
  const initialSheet = userSpreadsheet.getSheets()[0];
  initialSheet.setName(USER_EXPENSE_SHEET_NAME);
  ensureExpenseSheetHeader(initialSheet);
  scriptProperties.setProperty(propertyKey, userSpreadsheet.getId());

  return userSpreadsheet;
}

function getOrCreateUserExpenseSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = spreadsheet.getSheetByName(USER_EXPENSE_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(USER_EXPENSE_SHEET_NAME);
  }

  ensureExpenseSheetHeader(sheet);
  return sheet;
}

/**
 * 経費精算情報をスプレッドシートに保存
 */
function submitExpense(expenseData: ExpenseData): ExpenseResult {
  try {
    const spreadsheetId = getScriptProperty(
      "SPREADSHEET_ID",
      "スプレッドシートIDが設定されていません。"
    );
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const userEmail = Session.getEffectiveUser().getEmail();
    const expenseSheet = getOrCreateExpenseSheet(ss);

    const submittedDate = new Date();

    // ファイルアップロード処理
    let workScheduleUrl = "";

    if (expenseData.workScheduleFile) {
      workScheduleUrl = uploadFileToDrive(expenseData.workScheduleFile);
    }

    const commuteEntries = expenseData.commuteEntries || [];
    const expenseEntries = expenseData.expenseEntries || [];
    const commuteDetailsText = formatCommuteEntries(commuteEntries);
    const expenseEntryRecords = uploadExpenseReceipts(expenseEntries);
    const expenseDetailsText = formatExpenseEntries(expenseEntryRecords);

    const rowData = [
      submittedDate,
      userEmail,
      expenseData.name,
      workScheduleUrl,
      commuteDetailsText,
      expenseDetailsText,
      expenseData.workStartTime,
      expenseData.workEndTime,
      expenseData.hasCommuterPass === "yes" ? "有り" : "無し",
      expenseData.nearestStation,
      expenseData.workStation,
      expenseData.monthlyFee,
      expenseData.remarks,
    ];

    // 新規行を追加
    expenseSheet.appendRow(rowData);
    // ファイル列にハイパーリンクを設定
    const lastRow = expenseSheet.getLastRow();
    setFileHyperlink(
      expenseSheet,
      lastRow,
      4,
      expenseData.workScheduleFile?.name,
      workScheduleUrl
    );

    // 提出者ごとのスプレッドシートにも記録
    const userSpreadsheet = getOrCreateUserSpreadsheet(
      userEmail,
      expenseData.name
    );
    const userSheet = getOrCreateUserExpenseSheet(userSpreadsheet);
    userSheet.appendRow(rowData);
    const userLastRow = userSheet.getLastRow();
    setFileHyperlink(
      userSheet,
      userLastRow,
      4,
      expenseData.workScheduleFile?.name,
      workScheduleUrl
    );

    return {
      success: true,
      message: "経費精算フォームを提出しました",
      submittedDate: submittedDate.toISOString(),
    };
  } catch (error) {
    console.error("submitExpense error:", error);
    throw new Error(`登録処理エラー: ${(error as Error).message}`);
  }
}

/**
 * WebアプリのGETリクエスト処理
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile("index").setTitle(
    "経費精算フォーム"
  );
}
