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
 * GoogleスプレッドシートのURLからIDを抽出
 */
function extractSheetIdFromUrl(url: string): string {
  const match = url.match(/\/d\/(.+?)\//);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error('URLからスプレッドシートIDを抽出できませんでした。');
}

/**
 * Google DriveのフォルダURLからIDを抽出
 */
function extractFolderIdFromUrl(url: string): string {
  const match = url.match(/folders\/(.+)/);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error('URLからフォルダIDを抽出できませんでした。');
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

  const adminEmailsCsv =
    PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS');
  if (!adminEmailsCsv) {
    console.warn('ADMIN_EMAILSプロパティが設定されていません。');
    return [];
  }

  adminEmailsCache = adminEmailsCsv
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
  return adminEmailsCache;
}

/**
 * 指定したメールアドレスが管理者かどうかを判定
 */
function isAdmin(email: string): boolean {
  const admins = getAdminEmails();
  return admins.includes(email);
}
