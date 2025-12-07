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
  return slackController.doPost(e);
}

declare const window: any;

if (typeof window !== 'undefined') {
  window.doPost = doPost;
}
