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

export const getSlackBotToken = () =>
  getScriptProperty('SLACK_BOT_TOKEN', 'SLACK_BOT_TOKENが設定されていません。');

export const getBotUserId = () =>
  getScriptProperty('BOT_USER_ID', 'BOT_USER_IDが設定されていません。');
