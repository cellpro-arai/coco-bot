import { getSlackBotToken } from '../../properties';
import { SlackPresenter } from '../../adapter/slackPresenter';

export class SlackAPIPresenter implements SlackPresenter {
  postMessage(channelId: string, text: string): void {
    try {
      const resp: GoogleAppsScript.URL_Fetch.HTTPResponse = UrlFetchApp.fetch(
        'https://slack.com/api/chat.postMessage',
        {
          method: 'post',
          headers: { Authorization: 'Bearer ' + getSlackBotToken() },
          payload: JSON.stringify({ channel: channelId, text }),
          contentType: 'application/json',
          muteHttpExceptions: true,
        }
      );
      const data = JSON.parse(resp.getContentText());
      if (!data.ok) {
        console.error('chat.postMessage failed:', data);
      }
    } catch (err) {
      console.error('postMessage error:', err);
    }
  }
}
