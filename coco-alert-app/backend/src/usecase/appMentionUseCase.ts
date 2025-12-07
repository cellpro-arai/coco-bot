import { SpreadSheetRepository } from '../infrastructure/gas/spreadSheetRepository';
import { SlackPresenter } from '../infrastructure/slack/slackPresenter';
import { getBotUserId } from '../properties';

interface AppMentionEvent {
  user: string;
  text: string;
  client_msg_id: string;
  channel: string;
  ts: string;
}

export class AppMentionUseCase {
  constructor(
    private spreadSheetRepo: SpreadSheetRepository,
    private slackPresenter: SlackPresenter
  ) {}

  execute(event: AppMentionEvent): void {
    // メンション抽出とテキストからの除去
    let text: string = event.text;
    const botUserId = getBotUserId();

    const mentions: string[] = Array.from(
      new Set(
        (event.text.match(/<@([A-Z0-9]+)>/g) || [])
          .map(m => m.replace(/[<@>]/g, ''))
          .filter(id => id !== botUserId)
      )
    );

    text = text
      .replace(new RegExp(`<@(${event.user}|${botUserId})>`, 'g'), '')
      .trim();

    mentions.forEach((userId: string) => {
      const userCount: number = this.spreadSheetRepo.incrementUserCount(userId);
      const strictMessage: string =
        this.spreadSheetRepo.getStrictMessage(userCount);
      const message: string = `アラート:\n${text}\n\n:warning: cocoの一言: ${strictMessage}\n(${userCount}回目)`;

      // DM with button to the mentioned user
      const messageResponse = this.slackPresenter.postDMWithButton(
        userId,
        message,
        event.channel,
        event.ts
      );

      // メッセージIDとclient_msg_idをスプレッドシートに保存
      if (messageResponse) {
        this.spreadSheetRepo.saveMessage(
          event.client_msg_id,
          messageResponse.ts,
          'pending'
        );
      }
    });
  }
}
