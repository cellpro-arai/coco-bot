import { getSlackBotToken } from '../../properties';
import type { ChatPostMessageResponse } from '@slack/web-api/dist/types/response/ChatPostMessageResponse';

export interface MessageResponse {
  ts: string; // メッセージタイムスタンプ（メッセージID）
  channel: string; // DM送信先チャンネルID
  message_ts?: string; // message オブジェクトのタイムスタンプ
  message?: {
    type: string;
    user: string;
    text: string;
    ts: string;
  };
}

export interface SlackPresenter {
  postMessage(channel: string, message: string): void;
  postDMWithButton(
    userId: string,
    text: string,
    targetChannelId: string,
    targetMessageTs: string
  ): MessageResponse | null;
  updateMessage(channel: string, ts: string, text: string): boolean;
}

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
  ): MessageResponse | null {
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

      const result: ChatPostMessageResponse = JSON.parse(
        response.getContentText()
      );

      if (!result.ok) {
        console.error(
          'postDMWithButton failed:',
          result.error,
          result.response_metadata
        );
        return null;
      }

      return {
        ts: result.ts || '',
        channel: result.channel || '',
        message_ts: result.message?.ts,
        message: result.message
          ? {
              type: result.message.type || '',
              user: result.message.user || '',
              text: result.message.text || '',
              ts: result.message.ts || '',
            }
          : undefined,
      };
    } catch (error) {
      console.error('postDMWithButton error:', error);
      return null;
    }
  }

  updateMessage(channel: string, ts: string, text: string): boolean {
    try {
      const token = getSlackBotToken();

      const payload = {
        channel: channel,
        ts: ts,
        text: text,
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
        'https://slack.com/api/chat.update',
        options
      );

      const result = JSON.parse(response.getContentText());

      if (!result.ok) {
        console.error(
          'updateMessage failed:',
          result.error,
          result.response_metadata
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('updateMessage error:', error);
      return false;
    }
  }
}
