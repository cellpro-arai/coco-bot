import { SpreadSheetRepositoryImpl } from '../infrastructure/gas/spreadSheetRepository';
import { SlackAPIPresenter } from '../infrastructure/slack/slackPresenter';
import { logToSheet } from '../utils/logger';

interface BlockActionPayload {
  type: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
  trigger_id: string;
  container?: {
    type: string;
    message_ts: string;
    channel_id: string;
    is_ephemeral: boolean;
  };
  message?: {
    ts: string;
    [key: string]: any;
  };
  actions: Array<{
    action_id: string;
    value: string;
  }>;
}

// slack botのインタラクションイベント（完了ボタン）を処理するコントローラ
export class InteractionController {
  private spreadSheetRepo: SpreadSheetRepositoryImpl;
  private slackPresenter: SlackAPIPresenter;

  constructor() {
    this.spreadSheetRepo = new SpreadSheetRepositoryImpl();
    this.slackPresenter = new SlackAPIPresenter();
  }

  handleBlockAction(
    payload: BlockActionPayload
  ): GoogleAppsScript.Content.TextOutput {
    // Handle block actions (button clicks)
    const action = payload.actions[0];

    if (action.action_id === 'completion_button') {
      const buttonData = JSON.parse(action.value);

      // DMのメッセージタイムスタンプを取得
      const dmMessageTs = payload.container?.message_ts || payload.message?.ts;
      logToSheet('[handleBlockAction] dmMessageTs: ' + dmMessageTs);

      const dmChannelId = payload.container?.channel_id;
      logToSheet('[handleBlockAction] dmChannelId: ' + dmChannelId);

      this.handleCompletionButton(
        payload.user.name,
        buttonData.targetChannelId,
        dmChannelId || '',
        dmMessageTs
      );
    }

    return ContentService.createTextOutput('OK').setMimeType(
      ContentService.MimeType.TEXT
    );
  }

  private handleCompletionButton(
    userName: string,
    targetChannelId: string,
    dmUserId: string,
    dmMessageTs?: string
  ): void {
    if (!dmMessageTs) {
      logToSheet(
        '[handleCompletionButton] ERROR: DM message timestamp is missing'
      );
      return;
    }

    // スプレッドシートから メッセージ情報を取得（DM タイムスタンプで検索）
    const messageInfo = this.spreadSheetRepo.getMessageByTs(dmMessageTs);

    if (!messageInfo) {
      logToSheet(
        '[handleCompletionButton] ERROR: Message not found: ' + dmMessageTs
      );
      return;
    }

    // DM を完了メッセージで修正
    const completionText = `✅ ${userName}さんが完了しました`;
    const updated = this.slackPresenter.updateMessage(
      dmUserId,
      dmMessageTs,
      completionText
    );
    logToSheet('[handleCompletionButton] Updated: ' + updated);

    if (updated) {
      // スプレッドシートのステータスを「完了」に更新
      this.spreadSheetRepo.updateMessageStatus(dmMessageTs, 'completed');

      // 元のチャンネルに完了通知を投稿
      this.slackPresenter.postMessage(
        targetChannelId,
        `<@${dmUserId}> が <@${userName}> のアラートを完了しました`
      );
      logToSheet('[handleCompletionButton] Completed successfully');
    } else {
      logToSheet('[handleCompletionButton] ERROR: Failed to update message');
    }
  }
}
