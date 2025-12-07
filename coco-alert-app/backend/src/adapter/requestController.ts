import { SlackController } from './slackController';
import { InteractionController } from './interactionController';

export class RequestController {
  constructor(
    private slackController: SlackController,
    private interactionController: InteractionController
  ) {}

  doPost(
    e: GoogleAppsScript.Events.DoPost
  ): GoogleAppsScript.Content.TextOutput {
    let payload: any;

    // Slack からのペイロード解析
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      // Slack Interactions API は form-encoded で、payload キーにJSONが入っている
      const params = new URLSearchParams(e.postData.contents);
      const payloadString = params.get('payload');
      if (!payloadString) {
        return ContentService.createTextOutput('Missing payload').setMimeType(
          ContentService.MimeType.TEXT
        );
      }
      payload = JSON.parse(payloadString);
    } else {
      // Slack Events API は application/json で直接JSONが入っている
      payload = JSON.parse(e.postData.contents);
    }

    // リクエスト種別に応じてコントローラーに委譲
    if (
      payload.type === 'url_verification' ||
      payload.type === 'event_callback'
    ) {
      return this.slackController.doPost(e);
    } else if (payload.type === 'block_actions') {
      return this.interactionController.doPost(e);
    }

    return ContentService.createTextOutput('Unknown').setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}
