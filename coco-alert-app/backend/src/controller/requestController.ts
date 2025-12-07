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
    // GASの場合、form-encodedのpayloadはe.parameter.payloadでアクセス可能
    const parameter = (e as any).parameter;
    const parameters = e.parameters as any;

    // e.parameter.payload (単数形) または e.parameters.payload (複数形) をチェック
    let payloadString: string | undefined;
    if (parameter && parameter.payload) {
      payloadString = parameter.payload;
    } else if (parameters && parameters.payload) {
      // parametersの場合は配列の可能性があるので最初の要素を取得
      payloadString = Array.isArray(parameters.payload)
        ? parameters.payload[0]
        : parameters.payload;
    }

    if (payloadString) {
      payload = JSON.parse(payloadString);
    } else if (e.postData.type === 'application/json') {
      // Slack Events API は application/json で直接JSONが入っている
      payload = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(
        'Unable to parse payload'
      ).setMimeType(ContentService.MimeType.TEXT);
    }

    // リクエスト種別に応じてコントローラーに委譲
    if (
      payload.type === 'url_verification' ||
      payload.type === 'event_callback'
    ) {
      return this.slackController.doPost(e);
    } else if (payload.type === 'block_actions') {
      return this.interactionController.handleBlockAction(payload);
    }

    return ContentService.createTextOutput('Unknown').setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}
