import { getSpreadSheetId, getBotUserId, getTargetChannel } from './properties';
import { sendToChannel } from './slack';

const SHEET_LOG_NAME: string = 'log'; // ログ出力するシート名
const SHEET_USER_COUNT: string = 'user_count'; // ユーザーごとの集計を行うシート名
const SHEET_STRICT_MESSAGES: string = 'strict_messages'; // 厳しい一言が格納してあるシート名

interface SlackEvent {
  type?: string;
  challenge?: string;
  event?: {
    type: string;
    client_msg_id?: string;
    user: string;
    text: string;
  };
}

interface DoPostRequest {
  postData: {
    contents: string;
  };
}

// slack bot経由でメッセージを受信し、送信するAPI
function doPost(e: DoPostRequest): GoogleAppsScript.Content.TextOutput {
  try {
    const data: SlackEvent = JSON.parse(e.postData.contents);

    // URL検証用
    if (data.type === 'url_verification')
      return ContentService.createTextOutput(data.challenge || '');

    const event = data.event;
    if (!event || event.type !== 'app_mention')
      return ContentService.createTextOutput('OK');

    const clientMsgId = event.client_msg_id;
    if (!clientMsgId) {
      console.warn('client_msg_id missing, skipping.');
      return ContentService.createTextOutput('OK');
    }

    if (isDuplicateClientMsg(clientMsgId)) {
      console.log(`Duplicate message detected: ${clientMsgId}, skipping.`);
      return ContentService.createTextOutput('SKIPPED');
    }

    // 新規メッセージなので記録
    appendToSheet([new Date(), 'RECEIVE', event.user, event.text, clientMsgId]);

    // メイン処理実行
    doPostMain(event, clientMsgId);

    return ContentService.createTextOutput('OK');
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.message })
    );
  }
}

// 重複チェック
function isDuplicateClientMsg(clientMsgId: string): boolean {
  const sheet: GoogleAppsScript.Spreadsheet.Sheet =
    SpreadsheetApp.openById(getSpreadSheetId()).getSheetByName(SHEET_LOG_NAME)!;
  const data: (string | number | boolean | Date)[][] = sheet
    .getDataRange()
    .getValues();

  // client_msg_id が同じものがあればスキップ
  for (let i = 0; i < data.length; i++) {
    if (data[i][4] === clientMsgId) {
      // 5列目(client_msg_id)
      return true;
    }
  }
  return false;
}

function doPostMain(
  event: {
    type: string;
    client_msg_id?: string;
    user: string;
    text: string;
  },
  clientMsgId: string
): void {
  // メンション抽出とテキストからの除去
  let text: string = event.text;
  const botUserId = getBotUserId();
  const targetChannel = getTargetChannel();

  const mentions: string[] = (event.text.match(/<@([A-Z0-9]+)>/g) || [])
    .map(m => m.replace(/[<@>]/g, ''))
    .filter(id => id !== botUserId);

  [text] = [
    text.replace(new RegExp(`<@(${event.user}|${botUserId})>`, 'g'), '').trim(),
  ];

  mentions.forEach((userId: string) => {
    const userCount: number = incrementUserCount(userId);
    const strictMessage: string = getStrictMessage(userCount);
    const message: string = `<@${userId}> ${text}\n:warning: cocoの一言: ${strictMessage}\n現在${userCount}回目`;

    sendToChannel(targetChannel, message);

    // スプレッドシートに送信ログ（client_msg_idも残す）
    appendToSheet([new Date(), 'SEND', userId, message, clientMsgId]);
  });
}

// スプレッドシート追記
function appendToSheet(values: (string | number | Date)[]): void {
  const sheet: GoogleAppsScript.Spreadsheet.Sheet =
    SpreadsheetApp.openById(getSpreadSheetId()).getSheetByName(SHEET_LOG_NAME)!;
  sheet.appendRow(values);
}

// ユーザーごとの集計
function incrementUserCount(userName: string): number {
  const ss: GoogleAppsScript.Spreadsheet.Spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();
  const sheet: GoogleAppsScript.Spreadsheet.Sheet =
    ss.getSheetByName(SHEET_USER_COUNT)!;

  const data: (string | number | boolean | Date)[][] = sheet
    .getDataRange()
    .getValues(); // 全データ取得

  for (let i = 1; i < data.length; i++) {
    // 1行目はヘッダ
    if (data[i][0] === userName) {
      // 見つかったらカウント +1
      const incrementCount: number = (data[i][1] as number) + 1;
      sheet.getRange(i + 1, 2).setValue(incrementCount);
      return incrementCount;
    }
  }

  // 見つからなければ最後に追記
  sheet.appendRow([userName, 1]);
  return 1;
}

// 厳しい一言を抽出
function getStrictMessage(user_count: number): string {
  const ss: GoogleAppsScript.Spreadsheet.Spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();
  const sheet: GoogleAppsScript.Spreadsheet.Sheet = ss.getSheetByName(
    SHEET_STRICT_MESSAGES
  )!;
  const lastRow: number = sheet.getLastRow();
  // user_count % lastRow が 0 になった場合は最後の行を使う
  const row: number = user_count % lastRow || lastRow;
  const result: string = sheet.getRange(row, 1).getValue() as string;

  return result;
}

// ============================================================
// GASのグローバルスコープに関数を登録
// ============================================================
declare const window: any;

if (typeof window !== 'undefined') {
  window.doPost = doPost;
}
