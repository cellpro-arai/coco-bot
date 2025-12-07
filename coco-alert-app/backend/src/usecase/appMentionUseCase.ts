import { LogRepository } from '../domain/repository/logRepository';
import { StrictMessageRepository } from '../domain/repository/strictMessageRepository';
import { UserCountRepository } from '../domain/repository/userCountRepository';
import { SlackPresenter } from '../adapter/slackPresenter';
import { getBotUserId, getTargetChannel } from '../properties';

interface AppMentionEvent {
  user: string;
  text: string;
  client_msg_id: string;
}

export class AppMentionUseCase {
  constructor(
    private logRepo: LogRepository,
    private userCountRepo: UserCountRepository,
    private strictMessageRepo: StrictMessageRepository,
    private slackPresenter: SlackPresenter
  ) {}

  execute(event: AppMentionEvent): void {
    // メンション抽出とテキストからの除去
    let text: string = event.text;
    const botUserId = getBotUserId();
    const targetChannel = getTargetChannel();

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
      const userCount: number = this.userCountRepo.increment(userId);
      const strictMessage: string = this.strictMessageRepo.get(userCount);
      const message: string = `<@${userId}> ${text}\n:warning: cocoの一言: ${strictMessage}\n現在${userCount}回目`;

      this.slackPresenter.postMessage(targetChannel, message);

      // スプレッドシートに送信ログ（client_msg_idも残す）
      this.logRepo.save([
        new Date(),
        'SEND',
        userId,
        message,
        event.client_msg_id,
      ]);
    });
  }
}
