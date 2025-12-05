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

export const getSpreadSheetId = () =>
  getScriptProperty(
    'SPREADSHEET_ID',
    'スプレッドシートIDが設定されていません。'
  );

export const getUploadFolderId = () =>
  getScriptProperty(
    'UPLOAD_FOLDER_ID',
    'アップロード先のフォルダIDが設定されていません。'
  );

export const getTemplateSheetId = () =>
  getScriptProperty(
    'TEMPLATE_SHEET_ID',
    'テンプレートスプレッドシートIDが設定されていません。'
  );

export const getPermissionsCsvFileId = () =>
  getScriptProperty(
    'PERMISSIONS_CSV_FILE_ID',
    '権限管理CSVファイルIDが設定されていません。'
  );

export const getSlackBotToken = () =>
  getScriptProperty('SLACK_BOT_TOKEN', 'SLACK_BOT_TOKENが設定されていません。');
