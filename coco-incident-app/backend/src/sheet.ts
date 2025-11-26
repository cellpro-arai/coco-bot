const INCIDENT_SHEET_NAME = 'インシデント管理';

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

// Simple in-memory cache for admin emails
let adminEmailsCache: string[] | null = null;

/**
 * スクリプトプロパティから管理者メールアドレス一覧を取得
 */
function getAdminEmails(): string[] {
  if (adminEmailsCache) {
    return adminEmailsCache;
  }

  const adminEmailsCsv = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS');
  if (!adminEmailsCsv) {
    console.warn('ADMIN_EMAILSプロパティが設定されていません。');
    return [];
  }

  adminEmailsCache = adminEmailsCsv.split(',').map(email => email.trim()).filter(email => email.length > 0);
  return adminEmailsCache;
}

/**
 * 指定したメールアドレスが管理者かどうかを判定
 */
function isAdmin(email: string): boolean {
  const admins = getAdminEmails();
  return admins.includes(email);
}
