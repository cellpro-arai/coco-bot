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

  postDMWithButton(
    userId: string,
    text: string,
    targetChannelId: string,
    targetMessageTs: string
  ): void {
    try {
      const token = getSlackBotToken();

      const payload = {
        channel: userId,
        text: text,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: text,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '完了',
                  emoji: true,
                },
                value: JSON.stringify({
                  targetChannelId,
                  targetMessageTs,
                  userId,
                }),
                action_id: 'completion_button',
              },
            ],
          },
        ],
      };

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      };

      const response = UrlFetchApp.fetch(
        'https://slack.com/api/chat.postMessage',
        options
      );

      const result = JSON.parse(response.getContentText());

      if (!result.ok) {
        console.error(
          'postDMWithButton failed:',
          result.error,
          result.response_metadata
        );
      }
    } catch (error) {
      console.error('postDMWithButton error:', error);
    }
  }
}
