/**
 * Slackにインシデントのステータス変更を通知する
 * @param param0
 */
function sendSlack({
  caseName,
  assignee,
  oldStatus,
  newStatus,
  incidentDetailUrl,
  originalUserEmail,
}: {
  caseName: string;
  assignee: string;
  oldStatus: string;
  newStatus: string;
  incidentDetailUrl: string;
  originalUserEmail: string;
}) {
  if (oldStatus !== newStatus) {
    try {
      switch (newStatus) {
        case '差し戻し':
          break;
        default:
          const account = getSlackAccountByEmail(originalUserEmail);

          if (!account) {
            throw new Error(
              `ユーザー情報が見つかりません: ${originalUserEmail}`
            );
          }

          notifyStatusChanged({
            caseName: caseName,
            assignee: assignee,
            oldStatus: oldStatus,
            newStatus: newStatus,
            incidentDetailUrl: incidentDetailUrl,
            userId: account.id,
          });
      }
    } catch (e) {
      console.error('Slack通知の送信に失敗しました:', e);
      // 通知失敗してもエラーにはしない
    }
  }
}

type NotifyStatusChangedArgs = {
  caseName: string;
  assignee: string;
  oldStatus: string;
  newStatus: string;
  incidentDetailUrl: string;
  userId: string;
};

/**
 * Slackにインシデントのステータス変更を通知する
 * @param param0
 * @returns
 */
function notifyStatusChanged({
  caseName,
  assignee,
  oldStatus,
  newStatus,
  incidentDetailUrl,
  userId,
}: NotifyStatusChangedArgs): void {
  try {
    const token =
      PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');

    if (!token) {
      console.warn('SLACK_BOT_TOKEN が設定されていません');
      return;
    }

    // ステータスに応じた絵文字とメッセージ
    let emoji = '🔄';
    let statusColor = '#3AA3E3'; // デフォルトは青

    if (newStatus.includes('完了') || newStatus.includes('解決')) {
      emoji = '✅';
      statusColor = '#36A64F'; // 緑
    } else if (newStatus.includes('対応中') || newStatus.includes('調査中')) {
      emoji = '🔧';
      statusColor = '#FFA500'; // オレンジ
    } else if (newStatus.includes('保留') || newStatus.includes('待機')) {
      emoji = '⏸️';
      statusColor = '#CCCCCC'; // グレー
    } else if (newStatus.includes('緊急') || newStatus.includes('重大')) {
      emoji = '🚨';
      statusColor = '#E01E5A'; // 赤
    }

    const payload = {
      channel: userId,
      text: `${emoji} インシデントのステータスが更新されました`,
      attachments: [
        {
          color: statusColor,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*インシデント*: ${caseName}\n*担当者*: ${assignee}\n*旧ステータス*: ${oldStatus}\n*新ステータス*: ${newStatus}`,
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
