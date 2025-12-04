export type SlackAccount = {
  id: string;
  name: string;
  realName: string;
  email: string;
};

/**
 * Slackのメールアドレスからユーザー情報を取得する
 * @param email {string} Slackのメールアドレス
 * @return { id: string; name: string; realName: string; email: string } | null ユーザー情報またはnull
 */
export function getSlackAccountByEmail(email: string): SlackAccount | null {
  try {
    const token =
      PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');

    if (!token) {
      console.warn('SLACK_BOT_TOKEN が設定されていません');
      return null;
    }

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'get',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(
      `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`,
      options
    );

    const result = JSON.parse(response.getContentText());

    if (!result.ok) {
      console.warn(`ユーザーが見つかりませんでした: ${email}`, result.error);
      return null;
    }

    const user = result.user;
    return {
      id: user.id,
      name: user.name,
      realName: user.profile.real_name || user.name,
      email: user.profile.email,
    };
  } catch (error) {
    console.error('getAccountByEmail error:', error);
    return null;
  }
}

/**
 * 管理者ユーザーのSlackアカウント一覧を取得する
 * @returns {SlackAccount[]} 管理者ユーザーのSlackアカウント一覧
 */
export function getAdminAccounts(): SlackAccount[] {
  const adminEmailsCsv =
    PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS');
  if (!adminEmailsCsv) {
    console.warn('ADMIN_EMAILSプロパティが設定されていません。');
    return [];
  }

  const adminEmails = adminEmailsCsv
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
  const adminAccounts: SlackAccount[] = [];

  for (const email of adminEmails) {
    const account = getSlackAccountByEmail(email);
    if (account) {
      adminAccounts.push(account);
    } else {
      console.warn(`管理者ユーザーが見つかりませんでした: ${email}`);
    }
  }

  return adminAccounts;
}
