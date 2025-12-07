import { getSlackBotToken } from '../properties';

interface BlockActionPayload {
  type: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
  trigger_id: string;
  actions: Array<{
    action_id: string;
    value: string;
  }>;
}

export class InteractionController {
  doPost(
    e: GoogleAppsScript.Events.DoPost
  ): GoogleAppsScript.Content.TextOutput {
    try {
      const payload: BlockActionPayload = JSON.parse(e.postData.contents);

      // Handle block actions (button clicks)
      if (payload.type === 'block_actions') {
        const action = payload.actions[0];
        if (action.action_id === 'completion_button') {
          const buttonData = JSON.parse(action.value);
          this.handleCompletionButton(
            payload.user.name,
            buttonData.targetChannelId,
            buttonData.targetMessageTs
          );
        }
      }

      return ContentService.createTextOutput('OK').setMimeType(
        ContentService.MimeType.TEXT
      );
    } catch (err) {
      const error = err as Error;
      console.error('Interaction error:', error);
      return ContentService.createTextOutput('ERROR').setMimeType(
        ContentService.MimeType.TEXT
      );
    }
  }

  private handleCompletionButton(
    userName: string,
    targetChannelId: string,
    targetMessageTs: string
  ): void {
    try {
      const token = getSlackBotToken();

      const payload = {
        channel: targetChannelId,
        thread_ts: targetMessageTs,
        text: `✅ ${userName}さんが完了しました`,
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
          'Failed to post completion message:',
          result.error,
          result.response_metadata
        );
      }
    } catch (error) {
      console.error('handleCompletionButton error:', error);
    }
  }
}
