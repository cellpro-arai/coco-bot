import { getScriptProperty } from '../utils';

/**
 * 従業員マスタテーブルのシート名
 */
const EMPLOYEE_MASTER_SHEET_NAME = '従業員管理テーブル';

/**
 * 従業員情報を表すインターフェース
 */
export interface EmployeeInfo {
  employeeId: string;
  name: string;
  email: string;
  isActive: boolean;
}

/**
 * 従業員管理テーブルのスプレッドシートを取得する
 *
 * EMPLOYEE_MST_SHEET_ID プロパティから従業員管理テーブルの
 * スプレッドシートIDを取得し、スプレッドシートを開きます。
 *
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} 従業員管理スプレッドシート
 * @throws {Error} EMPLOYEE_MST_SHEET_ID が設定されていない場合
 */
function getEmployeeMasterSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const sheetId = getScriptProperty(
    'EMPLOYEE_MST_SHEET_ID',
    '従業員管理テーブルのスプレッドシートIDが設定されていません。'
  );
  return SpreadsheetApp.openById(sheetId);
}

/**
 * 従業員管理テーブルのシートを取得する
 *
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} 従業員管理テーブルシート
 * @throws {Error} シートが見つからない場合
 */
function getEmployeeMasterSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = getEmployeeMasterSpreadsheet();
  const sheet = ss.getSheetByName(EMPLOYEE_MASTER_SHEET_NAME);

  if (!sheet) {
    throw new Error(
      `従業員管理テーブルシート「${EMPLOYEE_MASTER_SHEET_NAME}」が見つかりません。`
    );
  }

  return sheet;
}

/**
 * 従業員管理テーブルから有効な従業員リストを取得する
 *
 * 従業員管理テーブルからヘッダー行を読み取り、列位置を自動判定します。
 * 有効フラグがTRUEの従業員のみを抽出し、メールアドレスでユニークなリストを返します。
 *
 * 期待されるヘッダー：
 * - 従業員ID
 * - 氏名
 * - メールアドレス
 * - 有効フラグ
 *
 * @returns {EmployeeInfo[]} 有効な従業員情報のリスト（メールアドレスでユニーク）
 */
export function getActiveEmployees(): EmployeeInfo[] {
  const sheet = getEmployeeMasterSheet();
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2) {
    // ヘッダー行のみ、またはデータなし
    Logger.log('従業員管理テーブルにデータが存在しません。');
    return [];
  }

  // ヘッダー行を取得して列位置を判定
  const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const employeeIdCol = headerRow.indexOf('従業員ID') + 1;
  const nameCol = headerRow.indexOf('氏名') + 1;
  const emailCol = headerRow.indexOf('メールアドレス') + 1;
  const activeFlagCol = headerRow.indexOf('有効フラグ') + 1;

  if (nameCol === 0 || emailCol === 0 || activeFlagCol === 0) {
    throw new Error(
      '従業員管理テーブルに必須カラム（氏名、メールアドレス、有効フラグ）が見つかりません。'
    );
  }

  // データ行を取得
  const dataRange = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  const dataRows = dataRange.getValues();

  // 有効な従業員をフィルタリング（メールアドレスでユニーク化）
  const emailSet = new Set<string>();
  const employees: EmployeeInfo[] = [];

  dataRows.forEach(row => {
    const employeeId =
      employeeIdCol > 0 ? String(row[employeeIdCol - 1] || '') : '';
    const name = String(row[nameCol - 1] || '').trim();
    const email = String(row[emailCol - 1] || '').trim();
    const isActive =
      row[activeFlagCol - 1] === true || row[activeFlagCol - 1] === 'TRUE';

    // 有効フラグがTRUEで、メールアドレスが存在し、まだ追加されていない場合のみ追加
    if (isActive && email && !emailSet.has(email)) {
      emailSet.add(email);
      employees.push({
        employeeId,
        name,
        email,
        isActive: true,
      });
    }
  });

  Logger.log(`有効な従業員を ${employees.length} 件取得しました。`);
  return employees;
}

/**
 * 現在のユーザーの従業員情報を従業員管理テーブルから取得する
 *
 * Session.getEffectiveUser()で取得したメールアドレスを元に、
 * 従業員管理テーブルから該当する従業員情報を検索します。
 *
 * @returns {EmployeeInfo | null} 従業員情報。見つからない場合はnull
 */
export function getCurrentUserEmployeeInfo(): EmployeeInfo | null {
  try {
    const userEmail = Session.getEffectiveUser().getEmail();

    if (!userEmail) {
      Logger.log('ユーザーのメールアドレスを取得できませんでした。');
      return null;
    }

    const employees = getActiveEmployees();
    const employee = employees.find(emp => emp.email === userEmail);

    if (!employee) {
      Logger.log(
        `従業員管理テーブルにメールアドレス ${userEmail} が見つかりませんでした。`
      );
      return null;
    }

    Logger.log(`従業員情報を取得: ${employee.name} (${employee.email})`);
    return employee;
  } catch (error) {
    Logger.log(`従業員情報の取得に失敗: ${(error as Error).message}`);
    return null;
  }
}
