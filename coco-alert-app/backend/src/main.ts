import { SlackController } from './adapter/slackController';
import { InteractionController } from './adapter/interactionController';
import { AppMentionUseCase } from './usecase/appMentionUseCase';
import { SpreadSheetLogRepository } from './infrastructure/gas/spreadSheetLogRepository';
import { SpreadSheetUserCountRepository } from './infrastructure/gas/spreadSheetUserCountRepository';
import { SpreadSheetStrictMessageRepository } from './infrastructure/gas/spreadSheetStrictMessageRepository';
import { SlackAPIPresenter } from './infrastructure/slack/presenter';

// DIコンテナの役割
const logRepository = new SpreadSheetLogRepository();
const userCountRepository = new SpreadSheetUserCountRepository();
const strictMessageRepository = new SpreadSheetStrictMessageRepository();
const slackPresenter = new SlackAPIPresenter();

const appMentionUseCase = new AppMentionUseCase(
  logRepository,
  userCountRepository,
  strictMessageRepository,
  slackPresenter
);

const slackController = new SlackController(appMentionUseCase, logRepository);
const interactionController = new InteractionController();

// ============================================================
// GASのグローバルスコープに関数を登録
// ============================================================
function doPost(
  e: GoogleAppsScript.Events.DoPost
): GoogleAppsScript.Content.TextOutput {
  try {
    let payload: any;

    // Slack Interactions API は form-encoded で、payload キーにJSONが入っている
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      const params = new URLSearchParams(e.postData.contents);
      const payloadString = params.get('payload');
      if (payloadString) {
        payload = JSON.parse(payloadString);
      } else {
        payload = JSON.parse(e.postData.contents);
      }
    } else {
      // Slack Events API は application/json で直接JSONが入っている
      payload = JSON.parse(e.postData.contents);
    }

    // Slack イベント API or Slack Interactions API
    if (
      payload.type === 'url_verification' ||
      payload.type === 'event_callback'
    ) {
      // Slack Events API
      return slackController.doPost(e);
    } else if (payload.type === 'block_actions') {
      // Slack Interactions API
      return interactionController.doPost(e);
    }

    return ContentService.createTextOutput('Unknown').setMimeType(
      ContentService.MimeType.TEXT
    );
  } catch (err) {
    const error = err as Error;
    console.error('doPost error:', error);
    return ContentService.createTextOutput('ERROR').setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}

declare const window: any;

if (typeof window !== 'undefined') {
  window.doPost = doPost;
}
