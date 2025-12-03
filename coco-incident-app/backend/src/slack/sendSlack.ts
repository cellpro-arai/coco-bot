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
    if (isNewIncident) {
      accounts = getAdminAccounts();
    } else {
      // 編集の場合はステータス変更時のみ通知
      if (oldStatus === newStatus) {
        return;
      }

      // originalUserEmailが現在のGoogleアカウントemailと同じ場合
      const currentUserEmail = Session.getActiveUser().getEmail();
      if (originalUserEmail === currentUserEmail) {
        accounts = getAdminAccounts();
      } else {
        const account = getSlackAccountByEmail(originalUserEmail);
        if (!account) {
          throw new Error(`ユーザー情報が見つかりません: ${originalUserEmail}`);
        }
        accounts.push(account);
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
