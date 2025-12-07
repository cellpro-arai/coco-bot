import { SlackController } from './adapter/slackController';
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

// ============================================================
// GASのグローバルスコープに関数を登録
// ============================================================
function doPost(
  e: GoogleAppsScript.Events.DoPost
): GoogleAppsScript.Content.TextOutput {
  try {
    const body = e.postData && e.postData.contents ? e.postData.contents : '';
    const data = body ? JSON.parse(body) : {};

    // URL検証リクエストの場合は即座に返す
    if (data && data.type === 'url_verification' && data.challenge) {
      return ContentService.createTextOutput(data.challenge).setMimeType(
        ContentService.MimeType.TEXT
      );
    }

    // 通常のイベント処理
    const result = slackController.doPost(e);
    return (
      result ||
      ContentService.createTextOutput('OK').setMimeType(
        ContentService.MimeType.TEXT
      )
    );
  } catch (err) {
    return ContentService.createTextOutput('ERROR').setMimeType(
      ContentService.MimeType.TEXT
    );
  }
}

declare const window: any;

if (typeof window !== 'undefined') {
  window.doPost = doPost;
}
