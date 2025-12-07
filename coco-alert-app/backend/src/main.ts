import { RequestController } from './controller/requestController';
import { SlackController } from './controller/slackController';
import { InteractionController } from './controller/interactionController';
import { AppMentionUseCase } from './usecase/appMentionUseCase';
import { CacheRepositoryImpl } from './infrastructure/gas/cacheRepository';
import { SpreadSheetRepositoryImpl } from './infrastructure/gas/spreadSheetRepository';
import { SlackAPIPresenter } from './infrastructure/slack/presenter';

// DIコンテナの役割
const ccdRepository = new CacheRepositoryImpl();
const spreadSheetRepository = new SpreadSheetRepositoryImpl();
const slackPresenter = new SlackAPIPresenter();

const appMentionUseCase = new AppMentionUseCase(
  spreadSheetRepository,
  slackPresenter
);

const slackController = new SlackController(appMentionUseCase, ccdRepository);
const interactionController = new InteractionController();
const requestController = new RequestController(
  slackController,
  interactionController
);

// ============================================================
// GASのグローバルスコープに関数を登録
// ============================================================
function doPost(
  e: GoogleAppsScript.Events.DoPost
): GoogleAppsScript.Content.TextOutput {
  return requestController.doPost(e);
}

declare const window: any;

if (typeof window !== 'undefined') {
  window.doPost = doPost;
}
