import { getSlackAccountByEmail, SlackAccount } from './getSlackUser';
import { getCurrentUserAndAll } from '../permissions/permissionManager';
import { getSlackBotToken } from '../properties';
import { INCIDENT_STATUS } from '../types/constants';

/**
 * Slackにインシデントのステータス変更を通知する
 * @param param0
 */
export function sendSlack({
  caseName,
  assignee,
  oldStatus,
  newStatus,
  incidentDetailUrl,
  originalUserEmail,
  isNewIncident,
}: {
  caseName: string;
  assignee: string;
  oldStatus: string;
  newStatus: string;
  incidentDetailUrl: string;
  originalUserEmail: string;
  isNewIncident: boolean;
}) {
  try {
    let accounts: SlackAccount[] = [];

    // 管理者ユーザーを取得
    const { users } = getCurrentUserAndAll();
    const adminUsers = users.filter(u => u.role === 'admin');

    if (isNewIncident) {
      // 新規登録時：起票で管理者に通知
      if (newStatus === INCIDENT_STATUS.REPORTED) {
        for (const adminUser of adminUsers) {
          const account = getSlackAccountByEmail(adminUser.email);
          if (account) {
            accounts.push(account);
          }
        }
      }
    } else {
      // 編集時：ステータス変更時のみ通知
      if (oldStatus === newStatus) {
        return;
      }

      // ステータス変更の対象者を決定
      if (
        newStatus === INCIDENT_STATUS.REPORTED ||
        newStatus === INCIDENT_STATUS.REVIEW_REQUESTED
      ) {
        // 管理者に通知
        for (const adminUser of adminUsers) {
          const account = getSlackAccountByEmail(adminUser.email);
          if (account) {
            accounts.push(account);
          }
        }
      } else if (newStatus === INCIDENT_STATUS.REJECTED) {
        // 担当者に通知（ただし管理者のみ差し戻し可能）
        const account = getSlackAccountByEmail(originalUserEmail);
        if (account) {
          accounts.push(account);
        }
      } else if (
        newStatus === INCIDENT_STATUS.IN_PROGRESS ||
        newStatus === INCIDENT_STATUS.CLOSED
      ) {
        // 担当者に通知
        const account = getSlackAccountByEmail(originalUserEmail);
        if (account) {
          accounts.push(account);
        }
      }
    }

    accounts.forEach(account => {
      notifySlack({
        caseName: caseName,
        assignee: assignee,
        oldStatus: oldStatus,
        newStatus: newStatus,
        incidentDetailUrl: incidentDetailUrl,
        userId: account.id,
        message: isNewIncident
          ? '新しいインシデントが登録されました'
          : 'インシデントのステータスが変更されました',
      });
    });
  } catch (e) {
    console.error('Slack通知の送信に失敗しました:', e);
    // 通知失敗してもエラーにはしない
  }
}

type NotifyStatusChangedArgs = {
  caseName: string;
  assignee: string;
  oldStatus: string;
  newStatus: string;
  incidentDetailUrl: string;
  userId: string;
  message: string;
};

/**
 * ステータスに応じた絵文字とカラーを取得する
 */
function getStatusEmojiAndColor(status: string): {
  emoji: string;
  statusColor: string;
} {
  switch (status) {
    case INCIDENT_STATUS.REPORTED:
      return { emoji: '📝', statusColor: '#0099FF' }; // 青
    case INCIDENT_STATUS.REVIEW_REQUESTED:
      return { emoji: '🔍', statusColor: '#0099FF' }; // 青
    case INCIDENT_STATUS.REJECTED:
      return { emoji: '❌', statusColor: '#E01E5A' }; // 赤
    case INCIDENT_STATUS.IN_PROGRESS:
      return { emoji: '🔧', statusColor: '#FFA500' }; // オレンジ
    case INCIDENT_STATUS.CLOSED:
      return { emoji: '✅', statusColor: '#36A64F' }; // 緑
    default:
      return { emoji: '🔄', statusColor: '#3AA3E3' }; // グレーブルー
  }
}

/**
 * Slackに通知する
 * @param param0
 * @returns
 */
function notifySlack({
  caseName,
  assignee,
  oldStatus,
  newStatus,
  incidentDetailUrl,
  userId,
  message,
}: NotifyStatusChangedArgs): void {
  try {
    const token = getSlackBotToken();

    // ステータスに応じた絵文字とカラーを取得
    const { emoji, statusColor } = getStatusEmojiAndColor(newStatus);

    const statusText =
      oldStatus === ''
        ? `ステータス: *${newStatus}*`
        : `*旧ステータス*: ${oldStatus}\n*新ステータス*: ${newStatus}`;

    const payload = {
      channel: userId,
      text: `${emoji} ${message}`,
      attachments: [
        {
          color: statusColor,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*インシデント*: ${caseName}\n*担当者*: ${assignee}\n${statusText}`,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'インシデント詳細を見る',
                    emoji: true,
                  },
                  url: incidentDetailUrl,
                },
              ],
            },
          ],
        },
      ],
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(
      'https://slack.com/api/chat.postMessage',
      options
    );

    const result = JSON.parse(response.getContentText());

    if (!result.ok) {
      console.error(
        'Slack通知の送信に失敗しました:',
        result.error,
        result.response_metadata
      );
    }
  } catch (error) {
    console.error('notifyStatusChanged error:', error);
  }
}
