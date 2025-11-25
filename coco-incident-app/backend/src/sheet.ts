const INCIDENT_SHEET_NAME = 'インシデント管理';
const PERMISSION_SHEET_NAME = '権限';

/**
 * インシデント管理シートを取得または作成
 */
function getOrCreateIncidentSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = spreadsheet.getSheetByName(INCIDENT_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(INCIDENT_SHEET_NAME);
    sheet.appendRow([
      '登録日時',
      '登録ユーザー',
      '案件名',
      '担当者',
      'ステータス',
      '更新日時',
      'Drive格納先フォルダ',
      'インシデント詳細',
    ]);
  }

  return sheet;
}

/**
 * 登録日時から既存レコードの行番号を検索
 */
function findIncidentRowByDate(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  registeredDate: string
): number {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return -1;
  }

  const dateRange = sheet.getRange(2, 1, lastRow - 1, 1);
  const dateValues = dateRange.getValues();

  for (let i = 0; i < dateValues.length; i++) {
    if (dateValues[i][0]) {
      const cellDate = new Date(dateValues[i][0]).toLocaleString('ja-JP');
      if (cellDate === registeredDate) {
        return i + 2;
      }
    }
  }

  return -1;
}

// Simple in-memory cache for permissions
let permissionsCache: Map<string, 'admin' | 'user'> | null = null;

/**
 * 権限シートから全ユーザーの権限を取得し、キャッシュする
 */
function getPermissions(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
): Map<string, 'admin' | 'user'> {
  if (permissionsCache) {
    return permissionsCache;
  }

  const permissionSheet = spreadsheet.getSheetByName(PERMISSION_SHEET_NAME);
  if (!permissionSheet) {
    throw new Error(`権限シート「${PERMISSION_SHEET_NAME}」が見つかりません。`);
  }

  const lastRow = permissionSheet.getLastRow();
  const permissions = new Map<string, 'admin' | 'user'>();

  if (lastRow > 1) {
    const data = permissionSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (const row of data) {
      const email = row[0];
      const role = row[1];
      if (email && (role === 'admin' || role === 'user')) {
        permissions.set(email, role);
      }
    }
  }

  permissionsCache = permissions;
  return permissions;
}

/**
 * 指定したメールアドレスのロールを取得
 */
function getUserRole(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  email: string
): 'admin' | 'user' | null {
  const permissions = getPermissions(spreadsheet);
  return permissions.get(email) || null;
}

/**
 * 全てのadminロールのメールアドレスを取得
 */
function getAdminEmails(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
): string[] {
  const permissions = getPermissions(spreadsheet);
  const admins: string[] = [];
  for (const [email, role] of permissions.entries()) {
    if (role === 'admin') {
      admins.push(email);
    }
  }
  return admins;
}
