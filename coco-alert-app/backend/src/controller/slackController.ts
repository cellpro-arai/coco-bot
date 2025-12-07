import { AppMentionEvent } from '@slack/types';
import { AppMentionUseCase } from '../usecase/appMentionUseCase';
import { CheckDuplicateRepository } from '../infrastructure/gas/cacheRepository';

// Slackからのイベントペイロードの型定義
// URL検証リクエスト、またはイベントコールバックのいずれかを表す
type SlackEventPayload =
  | { type: 'url_verification'; challenge: string }
  | { type: 'event_callback'; event: AppMentionEvent };

export class SlackController {
  constructor(
    private useCase: AppMentionUseCase,
    private logRepo: CheckDuplicateRepository
  ) {}

  doPost(
    e: GoogleAppsScript.Events.DoPost
  ): GoogleAppsScript.Content.TextOutput {
    try {
      const data: SlackEventPayload = JSON.parse(e.postData.contents);

      // URL検証用
      if (data.type === 'url_verification') {
        return ContentService.createTextOutput(data.challenge).setMimeType(
          ContentService.MimeType.TEXT
        );
      }

      const event = data.event;
      const clientMsgId = event.client_msg_id;
      const user = event.user;

      if (!clientMsgId || !user) {
        return ContentService.createTextOutput('OK').setMimeType(
          ContentService.MimeType.TEXT
        );
      }

      if (this.logRepo.isDuplicate(clientMsgId)) {
        console.log(`Duplicate message detected: ${clientMsgId}, skipping.`);
        return ContentService.createTextOutput('SKIPPED').setMimeType(
          ContentService.MimeType.TEXT
        );
      }

      // メイン処理実行
      this.useCase.execute({
        user,
        text: event.text,
        client_msg_id: clientMsgId,
        channel: event.channel,
        ts: event.ts,
      });

      return ContentService.createTextOutput('OK').setMimeType(
        ContentService.MimeType.TEXT
      );
    } catch (err) {
      const error = err as Error;
      console.error(error);
      return ContentService.createTextOutput('ERROR').setMimeType(
        ContentService.MimeType.TEXT
      );
    }
  }
}
