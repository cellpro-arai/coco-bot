/**
 * Slackに通知を送信（Bot Token版）
 */
function sendSlackNotification(incident: {
  caseName: string;
  assignee: string;
  status: string;
  summary: string;
  incidentDetailUrl: string;
  registeredUser: string;
}): void {
  try {
    const token =
      PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');

    if (!token) {
      console.warn('SLACK_BOT_TOKEN が設定されていません');
      return;
    }

    // 送信先チャンネルを指定（チャンネル名またはチャンネルID）
    const channel =
      PropertiesService.getScriptProperties().getProperty('SLACK_CHANNEL');

    const payload = {
      channel: channel,
      text: `🚨 新しいインシデントが登録されました`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚨 ${incident.caseName}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*担当者:*\n${incident.assignee}`,
            },
            {
              type: 'mrkdwn',
              text: `*ステータス:*\n${incident.status}`,
            },
            {
              type: 'mrkdwn',
              text: `*登録者:*\n${incident.registeredUser}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*概要:*\n${incident.summary}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '詳細を見る',
                emoji: true,
              },
              url: incident.incidentDetailUrl,
              style: 'primary',
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
      console.error('Slack通知送信エラー:', result.error);
    } else {
      console.log('Slack通知送信成功');
    }
  } catch (error) {
    console.error('sendSlackNotification error:', error);
  }
}

/**
 * インシデントのステータス変更をSlackに通知
 */
function notifyStatusChanged(
  caseName: string,
  assignee: string,
  oldStatus: string,
  newStatus: string,
  incidentDetailUrl: string
): void {
  try {
    const token =
      PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');

    if (!token) {
      console.warn('SLACK_BOT_TOKEN が設定されていません');
      return;
    }

    const channel =
      PropertiesService.getScriptProperties().getProperty('SLACK_CHANNEL');

    if (!channel) {
      console.error('SLACK_CHANNEL が設定されていません');
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
      channel: channel,
      text: `${emoji} インシデントのステータスが更新されました`,
      attachments: [
        {
          color: statusColor,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${emoji} ステータス変更: ${caseName}`,
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*担当者:*\n${assignee}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*ステータス変更:*\n${oldStatus} → ${newStatus}`,
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '詳細を見る',
                    emoji: true,
                  },
                  url: incidentDetailUrl,
                  style: 'primary',
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
      console.error('Slackステータス変更通知送信エラー:', result.error);
      console.error('エラー詳細:', JSON.stringify(result));
    } else {
      console.log('Slackステータス変更通知送信成功');
    }
  } catch (error) {
    console.error('notifyStatusChanged error:', error);
  }
}

/**
 * Slack通知のテスト
 */
function testSlackNotification(): void {
  sendSlackNotification({
    caseName: 'テストインシデント',
    assignee: '山田太郎',
    status: '対応中',
    summary: 'これはテスト通知です',
    incidentDetailUrl: 'https://example.com',
    registeredUser: 'test@example.com',
  });
}
