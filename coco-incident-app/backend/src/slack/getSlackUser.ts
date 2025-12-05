import { getSlackBotToken } from '../properties';

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
    const token = getSlackBotToken();

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
