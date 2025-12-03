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
