import {
  EXPENSE_MANAGEMENT_SHEET_NAME,
  EXPENSE_SHEET_HEADERS,
  EXPENSE_STATUS_OPTIONS,
  BACKUP_SHEET_NAME,
} from './expenseManagementTypes';
import { getScriptProperty } from '../utils';
import { getOrCreateChildFolder } from '../drive';
import { getActiveEmployees } from './employeeManagement';

/**
 * 月別管理スプレッドシートを取得または作成する
 *
 * rootFolder/{yyyy}/{mm}/管理シート の階層でスプレッドシートを自動生成します。
 * - 年フォルダ、月フォルダが存在しなければ自動作成
 * - 管理スプレッドシートが存在しなければ自動作成
 * - 既に存在すれば既存のスプレッドシートを使用
 *
 * @param {Date} submissionMonth - 提出月（expenseData.submissionMonthから変換されたDate）
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} 月別管理スプレッドシート
 */
export function getOrCreateMonthlyManagementSpreadsheet(
  submissionMonth: Date
): {
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
  isNewlyCreated: boolean;
} {
  // フォルダIDを取得
  const rootFolderId = getScriptProperty(
    'FORM_MANAGEMENT_FOLDER_ID',
    '管理フォルダIDが設定されていません。'
  );
  const rootFolder = DriveApp.getFolderById(rootFolderId);

  // 提出月から年フォルダを取得または作成
  const year = submissionMonth.getFullYear();
  const yearFolder = getOrCreateChildFolder(rootFolder, String(year));

  // 提出月から月フォルダを取得または作成
  const month = submissionMonth.getMonth() + 1;
  const monthFolder = getOrCreateChildFolder(
    yearFolder,
    String(month).padStart(2, '0')
  );

  // 管理スプレッドシート名
  const spreadsheetName = `${EXPENSE_MANAGEMENT_SHEET_NAME}_${year}_${String(month).padStart(2, '0')}`;

  // 月フォルダ内で既存のスプレッドシートを検索
  try {
    const files = monthFolder.getFilesByName(spreadsheetName);
    if (files.hasNext()) {
      const file = files.next();
      return {
        spreadsheet: SpreadsheetApp.openById(file.getId()),
        isNewlyCreated: false,
      };
    }
  } catch (error) {
    console.warn(
      `既存の管理スプレッドシート検索中にエラーが発生しました: ${(error as Error).message}`
    );
  }

  // 既存のスプレッドシートが見つからない場合、新規作成
  const newSpreadsheet = SpreadsheetApp.create(spreadsheetName);

  // 最初のシートを管理シートとして初期化
  const firstSheet = newSpreadsheet.getSheets()[0];
  firstSheet.setName(EXPENSE_MANAGEMENT_SHEET_NAME);
  ensureExpenseSheetHeader(firstSheet);

  // 新規作成時のみ、提出ステータス列にデータバリデーションを設定
  setStatusValidation(firstSheet);

  // 従業員管理テーブルから有効な従業員の初期行を投入
  const headerPositions = getHeaderColumnPositions(firstSheet);
  try {
    initializeEmployeeRows(firstSheet, headerPositions);
    Logger.log('✔ 従業員の初期行を投入しました。');
  } catch (error) {
    Logger.log(
      `従業員初期行の投入に失敗しました: ${(error as Error).message}`
    );
    // エラーがあっても処理を続行（従業員マスタが未設定の場合など）
  }

  // スプレッドシートの変更を確実にコミット
  SpreadsheetApp.flush();

  // Google Driveがファイルを認識するまで少し待機
  Utilities.sleep(2000);

  // 月フォルダに移動
  try {
    const fileId = newSpreadsheet.getId();
    const file = DriveApp.getFileById(fileId);

    // ルートフォルダからファイルを削除
    const parents = file.getParents();
    while (parents.hasNext()) {
      const parent = parents.next();
      parent.removeFile(file);
    }

    // 月フォルダに追加
    monthFolder.addFile(file);

    Logger.log(
      `✔ 管理スプレッドシートを月フォルダに移動: ${spreadsheetName}`
    );
  } catch (error) {
    const message = `月フォルダへの移動に失敗しました: ${(error as Error).message}`;
    Logger.log(message);
    throw new Error(message);
  }

  return {
    spreadsheet: newSpreadsheet,
    isNewlyCreated: true,
  };
}

/**
 * シートのヘッダー行から各ヘッダーの列位置を取得する
 *
 * シートの1行目からヘッダーを読み取り、EXPENSE_SHEET_HEADERSに定義された
 * 各ヘッダー名に対応する列番号（1始まり）のMapを返します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 対象シート
 * @returns {Map<string, number>} ヘッダー名をキー、列番号（1始まり）を値とするMap
 */
export function getHeaderColumnPositions(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): Map<string, number> {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) {
    return new Map();
  }

  const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const positions = new Map<string, number>();

  EXPENSE_SHEET_HEADERS.forEach(header => {
    const index = headerRow.indexOf(header);
    if (index !== -1) {
      positions.set(header, index + 1);
    }
  });

  return positions;
}

/**
 * 不足しているヘッダーをシートに追加する
 *
 * EXPENSE_SHEET_HEADERSに定義されているが、現在のシートに存在しない
 * ヘッダーを末尾に追加します。追加されたヘッダーの列位置もMapに反映されます。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 対象シート
 * @param {Map<string, number>} positions - 既存のヘッダー位置Map（この関数内で更新される）
 * @returns {Map<string, number>} 更新されたヘッダー位置Map
 */
export function addMissingHeaders(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  positions: Map<string, number>
): Map<string, number> {
  let nextColumn = sheet.getLastColumn() + 1;

  EXPENSE_SHEET_HEADERS.forEach(header => {
    if (!positions.has(header)) {
      sheet.getRange(1, nextColumn).setValue(header);
      positions.set(header, nextColumn);
      nextColumn++;
    }
  });

  return positions;
}

/**
 * 経費精算シートのヘッダーが存在することを保証する
 *
 * シートが空の場合はヘッダー行を新規作成し、既存シートの場合は
 * 不足しているヘッダーを追加します。
 * データバリデーションは設定しません（新規作成時に別途設定されます）。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 対象シート
 * @returns {void}
 */
export function ensureExpenseSheetHeader(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): void {
  const headers = EXPENSE_SHEET_HEADERS;

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const positions = getHeaderColumnPositions(sheet);

  if (positions.size < headers.length) {
    addMissingHeaders(sheet, positions);
  }
}

/**
 * 経費精算管理シートを取得または作成する
 *
 * 指定されたスプレッドシートから経費精算管理シートを取得します。
 * シートが存在しない場合は新規作成し、ヘッダー行を設定します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - 対象のスプレッドシート
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} 経費精算管理シート
 */
export function getOrCreateExpenseManagementSheet(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = ss.getSheetByName(EXPENSE_MANAGEMENT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(EXPENSE_MANAGEMENT_SHEET_NAME);
  }

  ensureExpenseSheetHeader(sheet);
  return sheet;
}

/**
 * シートから既存のメールアドレス一覧を取得する
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 対象シート
 * @param {Map<string, number>} headerPositions - ヘッダー位置のマップ
 * @returns {Set<string>} 既存のメールアドレスのセット
 */
function getExistingEmails(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  headerPositions: Map<string, number>
): Set<string> {
  const emailColumn = headerPositions.get('メールアドレス');
  if (!emailColumn) {
    return new Set();
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    // ヘッダー行のみ、またはデータなし
    return new Set();
  }

  // メールアドレス列のデータを取得（ヘッダー行を除く）
  const emailValues = sheet
    .getRange(2, emailColumn, lastRow - 1, 1)
    .getValues();

  const emails = new Set<string>();
  emailValues.forEach(row => {
    const email = String(row[0] || '').trim();
    if (email) {
      emails.add(email);
    }
  });

  return emails;
}

/**
 * 月別管理シートに従業員の初期行を投入する
 *
 * 従業員管理テーブルから有効な従業員を取得し、管理シートに初期行を追加します。
 * 既に存在する従業員（メールアドレスで判定）はスキップされます。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 対象の管理シート
 * @param {Map<string, number>} headerPositions - ヘッダー位置のマップ
 * @returns {void}
 */
export function initializeEmployeeRows(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  headerPositions: Map<string, number>
): void {
  // 従業員管理テーブルから有効な従業員を取得
  const employees = getActiveEmployees();

  if (employees.length === 0) {
    Logger.log('有効な従業員が見つかりません。初期行を投入しません。');
    return;
  }

  // 既存のメールアドレスを取得
  const existingEmails = getExistingEmails(sheet, headerPositions);

  // メールアドレス列、氏名列、提出ステータス列の位置を取得
  const emailColumn = headerPositions.get('メールアドレス');
  const nameColumn = headerPositions.get('氏名');
  const statusColumn = headerPositions.get('提出ステータス');

  if (!emailColumn || !nameColumn) {
    Logger.log('メールアドレス列または氏名列が見つかりません。');
    return;
  }

  let addedCount = 0;

  // 各従業員について、既存行がない場合のみ初期行を追加
  employees.forEach(employee => {
    if (!existingEmails.has(employee.email)) {
      const newRow = sheet.getLastRow() + 1;

      // メールアドレス、氏名、提出ステータス（未提出）をセット
      sheet.getRange(newRow, emailColumn).setValue(employee.email);
      sheet.getRange(newRow, nameColumn).setValue(employee.name);
      if (statusColumn) {
        sheet.getRange(newRow, statusColumn).setValue('未提出');
      }

      addedCount++;
    }
  });

  Logger.log(`${addedCount} 件の従業員初期行を追加しました。`);
}

/**
 * 提出ステータス列にデータバリデーションを設定する
 *
 * 提出ステータス列に対して、EXPENSE_STATUS_OPTIONS の値のみを許可する
 * ドロップダウンリストのデータバリデーションを設定します。
 * ヘッダー行（1行目）は除外され、2行目以降に適用されます。
 * テーブルビューが設定されている場合はエラーをログに記録して続行します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 対象シート
 * @returns {void}
 */
export function setStatusValidation(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): void {
  const headerPositions = getHeaderColumnPositions(sheet);
  const statusColumn = headerPositions.get('提出ステータス');

  if (!statusColumn) {
    Logger.log('提出ステータス列が見つかりません。バリデーションをスキップします。');
    return;
  }

  try {
    // データバリデーションを作成
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(EXPENSE_STATUS_OPTIONS as unknown as string[], true)
      .setAllowInvalid(false)
      .build();

    // 2行目以降の十分な行数（1000行）に適用
    const maxRows = Math.max(sheet.getLastRow(), 1000);
    if (maxRows > 1) {
      sheet.getRange(2, statusColumn, maxRows - 1, 1).setDataValidation(rule);
      Logger.log(`提出ステータス列（${statusColumn}列目）にデータバリデーションを設定しました。`);
    }
  } catch (error) {
    // テーブルビューが設定されている場合などに発生するエラーをキャッチ
    Logger.log(
      `提出ステータス列のデータバリデーション設定をスキップしました: ${(error as Error).message}`
    );
    Logger.log(
      'ヒント: スプレッドシートにテーブルビューが設定されている場合、データバリデーションを自動設定できません。手動で設定してください。'
    );
  }
}

/**
 * バックアップシートを取得または作成する
 *
 * 月次管理スプレッドシート内にバックアップシートが存在しない場合は新規作成し、
 * ヘッダー行を設定します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - 対象のスプレッドシート
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} バックアップシート
 */
export function getOrCreateBackupSheet(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = ss.getSheetByName(BACKUP_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(BACKUP_SHEET_NAME);
    // バックアップシートのヘッダーを設定
    const backupHeaders = [
      'バックアップ日時',
      '対象メールアドレス',
      '旧提出ステータス',
      ...EXPENSE_SHEET_HEADERS,
    ];
    sheet.appendRow(backupHeaders);
    Logger.log(`バックアップシート「${BACKUP_SHEET_NAME}」を作成しました。`);
  }

  return sheet;
}

/**
 * 既存の提出データをバックアップシートに保存する
 *
 * 管理シートの既存行データをバックアップシートに1行追加します。
 * バックアップ日時、対象メールアドレス、旧提出ステータス、既存行の全データを記録します。
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - 対象のスプレッドシート
 * @param {GoogleAppsScript.Spreadsheet.Sheet} managementSheet - 管理シート
 * @param {Map<string, number>} headerPositions - ヘッダー位置のマップ
 * @param {number} targetRow - バックアップ対象の行番号
 * @param {string} email - 対象メールアドレス
 * @param {string} oldStatus - 旧提出ステータス
 * @returns {void}
 */
export function backupExistingRow(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  managementSheet: GoogleAppsScript.Spreadsheet.Sheet,
  headerPositions: Map<string, number>,
  targetRow: number,
  email: string,
  oldStatus: string
): void {
  const backupSheet = getOrCreateBackupSheet(ss);

  // 既存行のデータを取得
  const lastColumn = managementSheet.getLastColumn();
  const rowData = managementSheet.getRange(targetRow, 1, 1, lastColumn).getValues()[0];

  // バックアップ行を構築
  const backupRow = [
    new Date(), // バックアップ日時
    email, // 対象メールアドレス
    oldStatus, // 旧提出ステータス
    ...rowData, // 既存行の全データ
  ];

  // バックアップシートに追加
  backupSheet.appendRow(backupRow);
  Logger.log(`メールアドレス ${email} のデータをバックアップしました。`);
}
