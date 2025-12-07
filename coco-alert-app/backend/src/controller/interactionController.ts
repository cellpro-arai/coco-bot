import { SpreadSheetRepositoryImpl } from '../infrastructure/gas/spreadSheetRepository';
import { SlackAPIPresenter } from '../infrastructure/slack/slackPresenter';

interface BlockActionPayload {
  type: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
  trigger_id: string;
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

      this.handleCompletionButton(
        payload.user.name,
        buttonData.targetChannelId,
        buttonData.targetMessageTs,
        buttonData.userId
      );
    }

    return ContentService.createTextOutput('OK').setMimeType(
      ContentService.MimeType.TEXT
    );
  }

  private handleCompletionButton(
    userName: string,
    targetChannelId: string,
    targetMessageTs: string,
    dmUserId: string
  ): void {
    const messageInfo = this.spreadSheetRepo.getMessageByTs(targetMessageTs);

    if (!messageInfo) {
      console.error(
        '[handleCompletionButton] Message not found in spreadsheet:',
        targetMessageTs
      );
      return;
    }

    // DM を完了メッセージで修正
    const completionText = `✅ ${userName}さんが完了しました`;

    const updated = this.slackPresenter.updateMessage(
      dmUserId,
      messageInfo.messageTs,
      completionText
    );

    if (updated) {
      // スプレッドシートのステータスを「完了」に更新
      this.spreadSheetRepo.updateMessageStatus(
        messageInfo.messageTs,
        'completed'
      );

      // 元のチャンネルに完了通知を投稿
      this.slackPresenter.postMessage(
        targetChannelId,
        `<@${dmUserId}> が <@${userName}> のアラートを完了しました`
      );
    }
  }
}
