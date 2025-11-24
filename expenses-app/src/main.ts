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
  tripType?: string;
}

interface ExpenseEntry {
  category: string;
  description: string;
  amount: string;
  receiptFile: FileData;
  certificateFile?: FileData | null;
}

interface ExpenseEntryRecord {
  category: string;
  description: string;
  amount: string;
  receiptUrl: string;
  certificateUrl?: string;
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
  "交通費合計",
  "経費合計",
  "合計金額",
];
const USER_EXPENSE_SHEET_NAME = "提出履歴";
const USER_SPREADSHEET_PROPERTY_PREFIX = "USER_SPREADSHEET_";
const USER_SPREADSHEET_NAME_PREFIX = "経費精算_";

/**
 * スプレッドシートに指定ヘッダーをセットし、無い場合は追加する
 */
function ensureSheetHeader(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  headers: string[]
): void {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsUpdate =
    headers.length !== currentHeaders.length ||
    headers.some((header, index) => currentHeaders[index] !== header);

  if (needsUpdate) {
    headerRange.setValues([headers]);
  }
}

/**
 * 経費精算シート専用のヘッダーを整備する
 */
function ensureExpenseSheetHeader(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): void {
  ensureSheetHeader(sheet, EXPENSE_SHEET_HEADERS);
}

/**
 * ファイル名を表示しつつURLのリンクをセルに設定する
 */
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

/**
 * 交通費詳細の配列を表示用テキストに整形する
 */
function formatCommuteEntries(entries: CommuteEntry[]): string {
  if (!entries || entries.length === 0) {
    return "";
  }

  return entries
    .map((entry, index) => {
      const amountText = entry.amount ? `${entry.amount}円` : "";
      const tripTypeText =
        entry.tripType === "roundTrip" ? "往復" : "片道";
      const parts = [
        `${index + 1}.`,
        `【${tripTypeText}】`,
        entry.date,
        `${entry.origin}→${entry.destination}`,
        amountText,
      ].filter(Boolean);

      return parts.join(" ");
    })
    .join("\n");
}

/**
 * 文字列の金額から数値のみ抽出して数値化する
 */
function toNumberAmount(value?: string): number {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 交通費明細の金額合計を求める
 */
function sumCommuteAmounts(entries: CommuteEntry[]): number {
  if (!entries || entries.length === 0) {
    return 0;
  }

  return entries.reduce(
    (total, entry) => total + toNumberAmount(entry.amount),
    0
  );
}

/**
 * 経費明細の金額合計を求める
 */
function sumExpenseAmounts(entries: ExpenseEntryRecord[]): number {
  if (!entries || entries.length === 0) {
    return 0;
  }

  return entries.reduce(
    (total, entry) => total + toNumberAmount(entry.amount),
    0
  );
}

/**
 * 経費の添付ファイルをアップロードしダウンロードURLを付与する
 */
function uploadExpenseReceipts(entries: ExpenseEntry[]): ExpenseEntryRecord[] {
  if (!entries || entries.length === 0) {
    return [];
  }

  return entries.map((entry) => {
    const category = entry.category || "other";
    const receiptUrl = entry.receiptFile
      ? uploadFileToDrive(entry.receiptFile)
      : "";
    const certificateUrl =
      category === "exam" && entry.certificateFile
        ? uploadFileToDrive(entry.certificateFile)
        : "";

    return {
      category,
      description: entry.description,
      amount: entry.amount,
      receiptUrl,
      certificateUrl,
    };
  });
}

/**
 * 経費詳細レコードを一覧表示向けテキストにまとめる
 */
function formatExpenseEntries(entries: ExpenseEntryRecord[]): string {
  if (!entries || entries.length === 0) {
    return "";
  }

  return entries
    .map((entry, index) => {
      const categoryLabel =
        entry.category === "exam" ? "試験申請" : "その他";
      const base = `${index + 1}. [${categoryLabel}] ${entry.description}（${entry.amount}円）`;
      const attachments = [];

      if (entry.receiptUrl) {
        attachments.push(`領収書: ${entry.receiptUrl}`);
      }

      if (entry.certificateUrl) {
        attachments.push(`合格通知書: ${entry.certificateUrl}`);
      }

      return attachments.length ? `${base}\n${attachments.join("\n")}` : base;
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

/**
 * ユーザーごとのスプレッドシートIDを保存するプロパティキーを生成する
 */
function getUserSpreadsheetPropertyKey(userEmail: string): string {
  return `${USER_SPREADSHEET_PROPERTY_PREFIX}${userEmail}`;
}

/**
 * ユーザー専用スプレッドシートを取得し無い場合は新規作成する
 */
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

/**
 * ユーザー専用スプレッドシート内に提出履歴シートを確保する
 */
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
    const totalCommuteAmount = sumCommuteAmounts(commuteEntries);
    const totalExpenseAmount = sumExpenseAmounts(expenseEntryRecords);
    const totalAmount = totalCommuteAmount + totalExpenseAmount;
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
      totalCommuteAmount,
      totalExpenseAmount,
      totalAmount,
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
