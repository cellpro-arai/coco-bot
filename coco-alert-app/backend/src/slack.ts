import { getSlackBotToken } from './properties';

// チャンネル送信
export function sendToChannel(channelId: string, text: string): void {
  const resp: GoogleAppsScript.URL_Fetch.HTTPResponse = UrlFetchApp.fetch(
    'https://slack.com/api/chat.postMessage',
    {
      method: 'post',
      headers: { Authorization: 'Bearer ' + getSlackBotToken() },
      payload: JSON.stringify({ channel: channelId, text }),
      contentType: 'application/json',
    }
  );
  const data = JSON.parse(resp.getContentText());
  if (!data.ok) console.error('chat.postMessage failed:', data);
}
