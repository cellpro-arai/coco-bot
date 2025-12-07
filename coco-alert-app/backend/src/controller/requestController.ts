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
      console.log(
        '[RequestController.doPost] Found e.parameter.payload (form-encoded)'
      );
      payloadString = parameter.payload;
    } else if (parameters && parameters.payload) {
      console.log(
        '[RequestController.doPost] Found e.parameters.payload (form-encoded)'
      );
      // parametersの場合は配列の可能性があるので最初の要素を取得
      payloadString = Array.isArray(parameters.payload)
        ? parameters.payload[0]
        : parameters.payload;
    }

    if (payloadString) {
      console.log('[RequestController.doPost] Raw payload:', payloadString);
      payload = JSON.parse(payloadString);
    } else if (e.postData.type === 'application/json') {
      console.log('[RequestController.doPost] Parsing JSON payload');
      // Slack Events API は application/json で直接JSONが入っている
      payload = JSON.parse(e.postData.contents);
    } else {
      console.error('[RequestController.doPost] Unable to parse payload');
      console.error(
        '[RequestController.doPost] postData:',
        JSON.stringify(e.postData)
      );
      console.error(
        '[RequestController.doPost] parameter:',
        JSON.stringify((e as any).parameter)
      );
      console.error(
        '[RequestController.doPost] parameters:',
        JSON.stringify(e.parameters)
      );
      return ContentService.createTextOutput(
        'Unable to parse payload'
      ).setMimeType(ContentService.MimeType.TEXT);
    }

    console.log(
      '[RequestController.doPost] Parsed payload type:',
      payload.type
    );

    // リクエスト種別に応じてコントローラーに委譲
    if (
      payload.type === 'url_verification' ||
      payload.type === 'event_callback'
    ) {
      console.log('[RequestController.doPost] Routing to slackController');
      return this.slackController.doPost(e);
    } else if (payload.type === 'block_actions') {
      console.log(
        '[RequestController.doPost] Routing to interactionController'
      );
      return this.interactionController.handleBlockAction(payload);
    }

    console.log('[RequestController.doPost] Unknown payload type');
    return ContentService.createTextOutput('Unknown').setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}
