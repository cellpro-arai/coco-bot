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

type TripType = "oneWay" | "roundTrip";
type ExpenseCategory = "ebook" | "udemy" | "seminar" | "certification" | "other";
type OfficeFrequency = "fullRemote" | "weekly1to2" | "weekly3to5";
type FolderType = "workSchedule" | "expenseReport" | "receipt";

/**
 * ファイルデータ
 */
interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded
}

/**
 * 交通費明細の1行分
 */
interface CommuteEntry {
  date: string;
  origin: string;
  destination: string;
  amount: string;
  tripType?: TripType;
}

/**
 * 経費明細の入力内容
 */
interface ExpenseEntry {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: string;
  receiptFile: FileData | null;
  certificateFile?: FileData | null;
}

/**
 * ファイルアップロード後の経費明細（URL付き）
 */
interface ExpenseEntryRecord {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: string;
  receiptUrl: string;
  certificateUrl?: string;
}

/**
 * フォーム全体の送信データ
 */
interface ExpenseData {
  name: string;
  submissionMonth: string;
  workScheduleFiles: FileData[];
  commuteEntries: CommuteEntry[];
  expenseEntries: ExpenseEntry[];
  workStartTime: string;
  workEndTime: string;
  officeFrequency: OfficeFrequency;
  hasCommuterPass: 'yes' | 'no';
  nearestStation: string;
  workStation: string;
  monthlyFee: string;
  remarks: string;
}

/**
 * 経費精算登録結果のレスポンス
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
 * フォルダタイプからプロパティキーを取得
 */
function getFolderPropertyKey(folderType: FolderType): string {
  switch (folderType) {
    case "workSchedule":
      return "WORK_SCHEDULE_FOLDER_ID";
    case "expenseReport":
      return "EXPENSE_REPORT_FOLDER_ID";
    case "receipt":
      return "RECEIPT_FOLDER_ID";
  }
}

/**
 * フォルダタイプから説明文を取得
 */
function getFolderDescription(folderType: FolderType): string {
  switch (folderType) {
    case "workSchedule":
      return "作業表フォルダ";
    case "expenseReport":
      return "経費精算書フォルダ";
    case "receipt":
      return "領収書フォルダ";
  }
}

/**
 * ファイルをGoogle Driveの指定フォルダにアップロード
 */
function uploadFileToDrive(fileData: FileData, folderType: FolderType): string {
  const propertyKey = getFolderPropertyKey(folderType);
  const folderDescription = getFolderDescription(folderType);

  const folderId = getScriptProperty(
    propertyKey,
    `${folderDescription}のIDが設定されていません。`
  );

  try {
    const folder = DriveApp.getFolderById(folderId);
    const decodedData = Utilities.base64Decode(fileData.data);
    const blob = Utilities.newBlob(decodedData, fileData.mimeType, fileData.name);
    const file = folder.createFile(blob);

    return file.getUrl();
  } catch (error) {
    throw new Error(`${folderDescription}へのアップロードに失敗しました: ${(error as Error).message}`);
  }
}

const EXPENSE_SHEET_NAME = "経費精算";
const EXPENSE_SHEET_HEADERS = [
  "提出日時",
  "提出者",
  "氏名",
  "提出月",
  "勤務表",
  "経費精算書",
  "領収書",
  "開始時間",
  "終了時間",
  "出社頻度",
  "定期券購入",
  "定期区間",
  "定期券金額",
  "備考",
];
const USER_SPREADSHEET_NAME_PREFIX = "経費精算書_";
const MONTHLY_SHEET_NAME = "経費精算書";

const COLOR_PRIMARY = "#0070C0";
const COLOR_WHITE = "white";
const BORDER_SOLID = SpreadsheetApp.BorderStyle.SOLID;
const BORDER_MEDIUM = SpreadsheetApp.BorderStyle.SOLID_MEDIUM;

/**
 * ヘッダー行から各列の位置を検出する
 */
function getHeaderColumnPositions(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): Map<string, number> {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) {
    return new Map();
  }

  const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const positions = new Map<string, number>();

  EXPENSE_SHEET_HEADERS.forEach((header) => {
    const index = headerRow.indexOf(header);
    if (index !== -1) {
      positions.set(header, index + 1); // 1-indexed
    }
  });

  return positions;
}

/**
 * 存在しないヘッダーを右端に追加する
 */
function addMissingHeaders(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  positions: Map<string, number>
): Map<string, number> {
  let nextColumn = sheet.getLastColumn() + 1;

  EXPENSE_SHEET_HEADERS.forEach((header) => {
    if (!positions.has(header)) {
      // ヘッダーを右端に追加
      sheet.getRange(1, nextColumn).setValue(header);
      positions.set(header, nextColumn);
      nextColumn++;
    }
  });

  return positions;
}

/**
 * ヘッダー行にGoogleフォーム風のスタイルを適用する
 */
function styleHeaderRow(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) {
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, lastColumn);

  // Googleフォーム風の深い紫色（スクリーンショット参考）
  const headerColor = "#673AB7";

  headerRange
    .setBackground(headerColor)
    .setFontColor("white")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true,
      "black",
      SpreadsheetApp.BorderStyle.SOLID
    );

  // セルの高さを余裕のあるサイズに設定
  sheet.setRowHeight(1, 32);
}

/**
 * 経費精算シート専用のヘッダーを整備する（スマート検出版）
 */
function ensureExpenseSheetHeader(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): void {
  const headers = EXPENSE_SHEET_HEADERS;

  // シートが空の場合は、最初の行にヘッダーを追加
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    styleHeaderRow(sheet);
    return;
  }

  // 既存のヘッダー位置を検出
  const positions = getHeaderColumnPositions(sheet);

  // 存在しないヘッダーがあれば右端に追加
  if (positions.size < headers.length) {
    addMissingHeaders(sheet, positions);
  }

  // ヘッダー行にスタイルを適用
  styleHeaderRow(sheet);
}

/**
 * ヘッダー位置マップに基づいて行データを追加する
 */
function appendRowWithHeaderPositions(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  headerPositions: Map<string, number>,
  dataMap: Map<string, string | number | Date>
): number {
  const newRow = sheet.getLastRow() + 1;

  dataMap.forEach((value, header) => {
    const column = headerPositions.get(header);
    if (column) {
      sheet.getRange(newRow, column).setValue(value);
    }
  });

  return newRow;
}

/**
 * シートにフィルターを作成する（存在しない場合のみ）
 */
function ensureFilterOnSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
  // 既存のフィルターを取得
  const existingFilter = sheet.getFilter();

  // フィルターが存在しない場合は作成
  if (!existingFilter) {
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    // データが存在する場合のみフィルターを作成
    if (lastRow > 0 && lastColumn > 0) {
      const range = sheet.getRange(1, 1, lastRow, lastColumn);
      range.createFilter();
    }
  }
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
 * 1つのセルに複数のハイパーリンクを設定する
 */
function setMultipleHyperlinks(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  row: number,
  column: number,
  links: Array<{ text: string; url: string }>
): void {
  if (!links || links.length === 0) {
    return;
  }

  // 1. 最初に全文を構築し、各リンクの位置を記録
  let fullText = "";
  const linkPositions: Array<{ start: number; end: number; url: string }> = [];
  let currentIndex = 0;

  links.forEach((link, index) => {
    if (index > 0) {
      fullText += ", ";
      currentIndex += 2;
    }

    const startIndex = currentIndex;
    fullText += link.text;
    currentIndex += link.text.length;

    linkPositions.push({
      start: startIndex,
      end: currentIndex,
      url: link.url,
    });
  });

  // 2. RichTextBuilderを作成してまずsetTextを呼び出す
  let richTextBuilder = SpreadsheetApp.newRichTextValue().setText(fullText);

  // 3. その後、各リンクにsetLinkUrlを呼び出す
  linkPositions.forEach((pos) => {
    richTextBuilder = richTextBuilder.setLinkUrl(pos.start, pos.end, pos.url);
  });

  sheet.getRange(row, column).setRichTextValue(richTextBuilder.build());
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
 * 経費の添付ファイルをアップロードしダウンロードURLを付与する
 */
function uploadExpenseReceipts(entries: ExpenseEntry[]): ExpenseEntryRecord[] {
  if (!entries || entries.length === 0) {
    return [];
  }

  return entries.map((entry) => {
    const category = entry.category || "other";
    const receiptUrl = entry.receiptFile
      ? uploadFileToDrive(entry.receiptFile, "receipt")
      : "";
    const certificateUrl =
      category === "certification" && entry.certificateFile
        ? uploadFileToDrive(entry.certificateFile, "receipt")
        : "";

    return {
      date: entry.date,
      category,
      description: entry.description,
      amount: entry.amount,
      receiptUrl,
      certificateUrl,
    };
  });
}


/**
 * 定期区間の入力値を「最寄り駅-勤務先の駅」の形式に整形する
 */
function formatCommuterRoute(
  origin: string,
  destination: string
): string {
  return [origin, destination].filter(Boolean).join("-");
}

/**
 * 出社頻度を日本語ラベルに変換する
 */
function formatOfficeFrequency(frequency: OfficeFrequency): string {
  switch (frequency) {
    case "fullRemote":
      return "フルリモート";
    case "weekly1to2":
      return "週1~2出社";
    case "weekly3to5":
      return "週3~5出社";
    default:
      return frequency;
  }
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
  ensureFilterOnSheet(sheet);
  return sheet;
}

/**
 * 指定した日付から月の最終日を取得する
 */
function getLastDayOfMonth(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  // 翌月の0日 = 当月の最終日
  return new Date(year, month + 1, 0);
}

/**
 * 年月文字列を生成する（例: "2025年1月"）
 */
function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}年${month}月`;
}

/**
 * スプレッドシートを Drive API v3 で目的のフォルダへ移動する
 */
function addSpreadsheetToFolder(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  folderType: FolderType
): void {
  const propertyKey = getFolderPropertyKey(folderType);
  const folderDescription = getFolderDescription(folderType);

  const folderId = getScriptProperty(
    propertyKey,
    `${folderDescription}のフォルダIDが設定されていません。`
  );

  try {
    const fileId = spreadsheet.getId();

    Logger.log(`対象ファイル: ${spreadsheet.getName()}`);
    Logger.log(`移動先フォルダID: ${folderId}`);

    // === DriveApp を使用してファイルを移動（シンプル & 外部リクエスト不要） ===
    const file = DriveApp.getFileById(fileId);
    const targetFolder = DriveApp.getFolderById(folderId);

    // 既存の親フォルダから削除
    const parents = file.getParents();
    while (parents.hasNext()) {
      const parent = parents.next();
      Logger.log(`旧フォルダから削除: ${parent.getName()}`);
      parent.removeFile(file);
    }

    // 新しいフォルダに追加
    targetFolder.addFile(file);

    Logger.log(`✔ ${folderDescription}への移動に成功: ${spreadsheet.getName()}`);

  } catch (error) {
    const message = `${folderDescription}への移動に失敗しました: ${(error as Error).message}`;
    Logger.log(message);
    throw new Error(message);
  }
}

/**
 * ユーザー専用の月次スプレッドシートを取得し無い場合は新規作成する
 */
function getOrCreateMonthlySpreadsheet(
  userEmail: string,
  userName: string,
  date: Date
): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const yearMonth = formatYearMonth(date);
  const spreadsheetName = `${USER_SPREADSHEET_NAME_PREFIX}${userName || userEmail}_${yearMonth}`;

  // 経費精算書フォルダ内で既存のスプレッドシートを検索
  try {
    const folderId = getScriptProperty(
      "EXPENSE_REPORT_FOLDER_ID",
      "経費精算書フォルダのIDが設定されていません。"
    );
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(spreadsheetName);

    // 同名のファイルが見つかった場合、最初のものを使用
    if (files.hasNext()) {
      const file = files.next();
      return SpreadsheetApp.openById(file.getId());
    }
  } catch (error) {
    console.warn(
      `既存のスプレッドシート検索中にエラーが発生しました: ${(error as Error).message}`
    );
  }

  // 既存のスプレッドシートが見つからない場合、新規作成
  const monthlySpreadsheet = SpreadsheetApp.create(spreadsheetName);

  // 最初のシートを経費精算書として初期化
  const firstSheet = monthlySpreadsheet.getSheets()[0];
  firstSheet.setName(MONTHLY_SHEET_NAME);
  initializeMonthlyExpenseSheet(firstSheet, userName, date);

  // スプレッドシートの変更を確実にコミット
  SpreadsheetApp.flush();

  // Google Driveがファイルを認識するまで少し待機
  Utilities.sleep(2000);

  // 経費精算書フォルダに追加
  addSpreadsheetToFolder(monthlySpreadsheet, "expenseReport");

  return monthlySpreadsheet;
}

/**
 * 月次経費精算書シートを指定フォーマットで初期化
 */
function initializeMonthlyExpenseSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  userName: string,
  date: Date
): void {

  // ========= 初期化 =========
  sheet.clear();

  // ========= タイトル =========
  const titleRange = sheet.getRange("A2:D3");
  titleRange
    .merge()
    .setValue("経費精算書")
    .setFontSize(14)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBackground(COLOR_PRIMARY)
    .setFontColor(COLOR_WHITE)
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  // ========= 申請日 =========
  const b5 = sheet.getRange("B5");
  b5.setValue("申請日")
    .setFontSize(12)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBackground(COLOR_PRIMARY)
    .setFontColor(COLOR_WHITE)
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  const c5 = sheet.getRange("C5");
  c5.setValue(getLastDayOfMonth(date))
    .setNumberFormat("yyyy年mm月dd日")
    .setFontSize(14)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  // ========= 氏名 =========
  const b6 = sheet.getRange("B6");
  b6.setValue("氏名")
    .setFontSize(12)
    .setFontWeight("bold")
    .setBackground(COLOR_PRIMARY)
    .setFontColor(COLOR_WHITE)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  const c6 = sheet.getRange("C6");
  c6.setValue(userName)
    .setFontSize(14)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  // ========= 明細ヘッダー =========
  const headerRange = sheet.getRange("A9:D9");
  headerRange
    .setValues([["番号", "日付", "内容", "金額"]])
    .setFontWeight("bold")
    .setFontSize(12)
    .setBackground(COLOR_PRIMARY)
    .setFontColor(COLOR_WHITE)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBorder(true, true, true, true, true, true, null, BORDER_SOLID)
    .setBorder(true, null, null, true, null, null, null, BORDER_MEDIUM);

  // ========= 列幅調整 =========
  sheet.setColumnWidth(1, 60);   // A列: 番号
  sheet.setColumnWidth(2, 100);  // B列: 日付
  sheet.setColumnWidth(3, 300);  // C列: 内容
  sheet.setColumnWidth(4, 100);  // D列: 金額
}


/**
 * 交通費エントリーの表示用データ行を作成する
 */
interface ExpenseRowData {
  date: string;
  description: string;
  amount: number;
}

/**
 * 交通費エントリーを表示用データに変換する
 */
function convertCommuteToRowData(entry: CommuteEntry): ExpenseRowData {
  const tripTypeLabel = entry.tripType === "roundTrip" ? "往復" : "片道";
  const description = `${entry.origin}-${entry.destination} ${tripTypeLabel}`;

  // 片道の金額
  const oneWayAmount = toNumberAmount(entry.amount);

  // 往復の場合は2倍
  const amount = entry.tripType === "roundTrip" ? oneWayAmount * 2 : oneWayAmount;

  return {
    date: entry.date,
    description,
    amount
  };
}

/**
 * 経費エントリーを表示用データに変換する
 */
function convertExpenseToRowData(entry: ExpenseEntryRecord): ExpenseRowData {
  return {
    date: entry.date,
    description: entry.description,
    amount: toNumberAmount(entry.amount)
  };
}

/**
 * 月次経費精算書シートに交通費・経費データを追加する
 */
function addExpenseDataToMonthlySheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  commuteEntries: CommuteEntry[],
  expenseEntries: ExpenseEntryRecord[]
): void {
  // 交通費と経費を結合
  const commuteRows = commuteEntries.map(convertCommuteToRowData);
  const expenseRows = expenseEntries.map(convertExpenseToRowData);
  const allRows = [...commuteRows, ...expenseRows];

  if (allRows.length === 0) {
    return;
  }

  // 既存のデータ行数を取得（10行目から開始）
  const startRow = 10;
  const lastRow = sheet.getLastRow();
  let currentRowNumber = lastRow >= startRow ? lastRow - startRow + 2 : 1;

  // データを追加
  allRows.forEach((rowData, index) => {
    const rowIndex = startRow + index + (lastRow >= startRow ? lastRow - startRow + 1 : 0);

    // A列: 番号
    sheet.getRange(rowIndex, 1).setValue(currentRowNumber);

    // B列: 日付
    if (rowData.date) {
      sheet.getRange(rowIndex, 2).setValue(rowData.date);
      sheet.getRange(rowIndex, 2).setNumberFormat("yyyy/mm/dd");
    }

    // C列: 内容
    sheet.getRange(rowIndex, 3).setValue(rowData.description);

    // D列: 金額
    sheet.getRange(rowIndex, 4).setValue(rowData.amount);
    sheet.getRange(rowIndex, 4).setNumberFormat("¥#,##0");

    currentRowNumber++;
  });

  // 追加したデータ範囲に罫線を引く
  const dataStartRow = startRow + (lastRow >= startRow ? lastRow - startRow + 1 : 0);
  const dataRange = sheet.getRange(dataStartRow, 1, allRows.length, 4);
  const centerRange = sheet.getRange(dataStartRow, 1, allRows.length, 1);
  centerRange.setHorizontalAlignment("center");
  // データ行全体
  dataRange.setBorder(
    false, true, true, true, true, true,
    null,
    SpreadsheetApp.BorderStyle.SOLID
  )
  .setFontSize(11)
  .setVerticalAlignment("middle");

  // 右側（D列）だけ太線にする
  const rightEdgeRange = sheet.getRange(dataStartRow, 4, allRows.length, 1);
  rightEdgeRange.setBorder(
    null, null, null, true, null, null,
    null,
    SpreadsheetApp.BorderStyle.SOLID_MEDIUM
  );

  // 合計金額行を追加
  const totalRow = dataStartRow + allRows.length;
  const totalAmount = allRows.reduce((sum, row) => sum + row.amount, 0);

  // A:C列に「合計金額」を結合して表示
  const totalLabelRange = sheet.getRange(totalRow, 1, 1, 3);
  totalLabelRange.merge();
  totalLabelRange.setFontWeight("bold");
  totalLabelRange.setFontSize(12);
  totalLabelRange.setValue("合計金額");
  totalLabelRange.setHorizontalAlignment("center");
  totalLabelRange.setVerticalAlignment("middle");
  totalLabelRange.setBackground("#0070C0");
  totalLabelRange.setFontColor("white");

  // D列に合計金額を表示
  sheet.getRange(totalRow, 4).setValue(totalAmount);
  sheet.getRange(totalRow, 4).setNumberFormat("¥#,##0");
  sheet.getRange(totalRow, 4).setFontWeight("bold");
  sheet.getRange(totalRow, 4).setFontSize(14);

  // 合計金額行に罫線を引く
  const totalRowRange = sheet.getRange(totalRow, 1, 1, 4);
  totalRowRange
  .setBorder(true, true, true, true, true, true, null, BORDER_SOLID)
  .setBorder(null, true, true, true, null, null, null, BORDER_MEDIUM);
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

    // ファイルアップロード処理（作業表フォルダへ）
    const workScheduleUrls: string[] = [];

    if (expenseData.workScheduleFiles && expenseData.workScheduleFiles.length > 0) {
      expenseData.workScheduleFiles.forEach((file) => {
        const url = uploadFileToDrive(file, "workSchedule");
        workScheduleUrls.push(url);
      });
    }

    const commuteEntries = expenseData.commuteEntries || [];
    const expenseEntries = expenseData.expenseEntries || [];
    const expenseEntryRecords = uploadExpenseReceipts(expenseEntries);
    const commuterRoute = formatCommuterRoute(
      expenseData.nearestStation,
      expenseData.workStation
    );

    // 提出者ごとの月次スプレッドシートに記録
    const monthlySpreadsheet = getOrCreateMonthlySpreadsheet(
      userEmail,
      expenseData.name,
      submittedDate
    );
    const monthlySheet = monthlySpreadsheet.getSheetByName(MONTHLY_SHEET_NAME);

    if (!monthlySheet) {
      throw new Error("月次経費精算書シートの取得に失敗しました。");
    }

    // 既存のシートをクリアして新規フォーマットで再初期化
    initializeMonthlyExpenseSheet(monthlySheet, expenseData.name, submittedDate);

    // 月次シートに交通費・経費データを追加
    addExpenseDataToMonthlySheet(monthlySheet, commuteEntries, expenseEntryRecords);

    // 月次スプレッドシートのURLを取得
    const monthlySpreadsheetUrl = monthlySpreadsheet.getUrl();

    // 領収書リンクのリストを作成
    const receiptLinks: Array<{ text: string; url: string }> = [];
    expenseEntryRecords.forEach((entry, index) => {
      if (entry.receiptUrl) {
        receiptLinks.push({
          text: `領収書${index + 1}`,
          url: entry.receiptUrl,
        });
      }
      if (entry.certificateUrl) {
        receiptLinks.push({
          text: `合格通知書${index + 1}`,
          url: entry.certificateUrl,
        });
      }
    });

    // 提出がない場合のチェック
    const hasWorkSchedule = workScheduleUrls.length > 0;
    const hasReceipts = receiptLinks.length > 0;
    const hasExpenseData = commuteEntries.length > 0 || expenseEntryRecords.length > 0;

    // ヘッダー位置を検出
    const headerPositions = getHeaderColumnPositions(expenseSheet);

    // データマップを作成
    const dataMap = new Map<string, string | number | Date>();
    dataMap.set("提出日時", submittedDate);
    dataMap.set("提出者", userEmail);
    dataMap.set("氏名", expenseData.name);
    dataMap.set("提出月", expenseData.submissionMonth);
    dataMap.set("勤務表", hasWorkSchedule ? "勤務表" : "提出なし");
    dataMap.set("経費精算書", hasExpenseData ? "経費精算書" : "提出なし");
    dataMap.set("領収書", hasReceipts ? "領収書" : "提出なし");
    dataMap.set("開始時間", expenseData.workStartTime);
    dataMap.set("終了時間", expenseData.workEndTime);
    dataMap.set("出社頻度", formatOfficeFrequency(expenseData.officeFrequency));
    dataMap.set("定期券購入", expenseData.hasCommuterPass === "yes" ? "有り" : "無し");
    dataMap.set("定期区間", commuterRoute);
    dataMap.set("定期券金額", expenseData.monthlyFee);
    dataMap.set("備考", expenseData.remarks);

    // 新規行を追加（スマート検出した列位置に基づいて）
    const lastRow = appendRowWithHeaderPositions(expenseSheet, headerPositions, dataMap);

    // 提出日時列に日時形式を設定
    const submittedDateColumn = headerPositions.get("提出日時");
    if (submittedDateColumn) {
      expenseSheet.getRange(lastRow, submittedDateColumn).setNumberFormat("yyyy/mm/dd hh:mm:ss");
    }

    // 勤務表列に複数のハイパーリンクを設定（提出がある場合のみ）
    if (hasWorkSchedule) {
      const column = headerPositions.get("勤務表");
      if (column) {
        const workScheduleLinks = expenseData.workScheduleFiles.map((file, index) => ({
          text: file.name || `勤務表${index + 1}`,
          url: workScheduleUrls[index]
        }));
        setMultipleHyperlinks(expenseSheet, lastRow, column, workScheduleLinks);
      }
    }

    // 経費精算書列にハイパーリンクを設定（データがある場合のみ）
    if (hasExpenseData) {
      const column = headerPositions.get("経費精算書");
      if (column) {
        setFileHyperlink(
          expenseSheet,
          lastRow,
          column,
          "経費精算書",
          monthlySpreadsheetUrl
        );
      }
    }

    // 領収書列に複数のハイパーリンクを設定（提出がある場合のみ）
    if (hasReceipts) {
      const column = headerPositions.get("領収書");
      if (column) {
        setMultipleHyperlinks(expenseSheet, lastRow, column, receiptLinks);
      }
    }

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

// ========================================
// 初回セットアップ用ヘルパー関数
// ========================================

/**
 * 【初回セットアップ】スクリプトプロパティを一括設定する
 *
 * 使い方:
 * 1. 下記のIDを実際の値に書き換えて、この関数を実行
 * 2. または、Apps ScriptエディタのGUIから直接設定
 *    「プロジェクトの設定」→「スクリプト プロパティ」→「プロパティを追加」
 */
function setupAllProperties(): void {
  const properties = {
    // ここに実際のIDを設定してください
    "SPREADSHEET_ID": "YOUR_SPREADSHEET_ID_HERE",
    "WORK_SCHEDULE_FOLDER_ID": "YOUR_WORK_SCHEDULE_FOLDER_ID_HERE",
    "EXPENSE_REPORT_FOLDER_ID": "YOUR_EXPENSE_REPORT_FOLDER_ID_HERE",
    "RECEIPT_FOLDER_ID": "YOUR_RECEIPT_FOLDER_ID_HERE"
  };

  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties(properties);

  Logger.log("✅ すべてのプロパティを設定しました");
  Logger.log("設定内容:");
  for (const [key, value] of Object.entries(properties)) {
    Logger.log(`  ${key}: ${value}`);
  }
}

/**
 * 【確認用】現在の設定を表示する
 */
function showCurrentSettings(): void {
  const scriptProperties = PropertiesService.getScriptProperties();
  const settings = {
    "SPREADSHEET_ID": scriptProperties.getProperty("SPREADSHEET_ID") || "未設定",
    "WORK_SCHEDULE_FOLDER_ID": scriptProperties.getProperty("WORK_SCHEDULE_FOLDER_ID") || "未設定",
    "EXPENSE_REPORT_FOLDER_ID": scriptProperties.getProperty("EXPENSE_REPORT_FOLDER_ID") || "未設定",
    "RECEIPT_FOLDER_ID": scriptProperties.getProperty("RECEIPT_FOLDER_ID") || "未設定"
  };

  Logger.log("📋 現在の設定:");
  Logger.log(`  全体管理用スプレッドシートID: ${settings.SPREADSHEET_ID}`);
  Logger.log(`  作業表フォルダID: ${settings.WORK_SCHEDULE_FOLDER_ID}`);
  Logger.log(`  経費精算書フォルダID: ${settings.EXPENSE_REPORT_FOLDER_ID}`);
  Logger.log(`  領収書フォルダID: ${settings.RECEIPT_FOLDER_ID}`);
}
