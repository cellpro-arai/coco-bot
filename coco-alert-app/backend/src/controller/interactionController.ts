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
      const dmChannelId = payload.container?.channel_id;
      const userId = payload.user.id;

      this.handleCompletionButton(
        buttonData.targetChannelId,
        dmChannelId || '',
        dmMessageTs,
        buttonData.targetMessageTs,
        userId
      );
    }

    return ContentService.createTextOutput('OK').setMimeType(
      ContentService.MimeType.TEXT
    );
  }

  private handleCompletionButton(
    targetChannelId: string,
    dmChannelId: string,
    dmMessageTs?: string,
    targetMessageTs?: string,
    userId?: string
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
    const completionText = `✅ 完了しました`;
    const updated = this.slackPresenter.updateMessage(
      dmChannelId,
      dmMessageTs,
      completionText
    );

    if (updated) {
      // スプレッドシートから行を削除
      this.spreadSheetRepo.deleteMessageRow(dmMessageTs);

      // ユーザー名を取得
      let userName: string | null = null;
      if (userId) {
        userName = this.slackPresenter.getUserName(userId);
      }
      const userDisplay = userName || (userId ? `<@${userId}>` : 'ユーザー');

      // 元のチャンネルのスレッドに完了通知を投稿
      const threadReplyText = `${userDisplay} が完了しました`;
      if (targetMessageTs) {
        this.slackPresenter.postMessageInThread(
          targetChannelId,
          threadReplyText,
          targetMessageTs
        );
      } else {
        this.slackPresenter.postMessage(targetChannelId, threadReplyText);
      }
    } else {
      logToSheet('[handleCompletionButton] ERROR: Failed to update message');
    }
  }
}
