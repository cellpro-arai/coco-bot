import { getSpreadSheetId } from '../../properties';

const SHEET_STRICT_MESSAGES = 'strict_messages';
const SHEET_USER_COUNT = 'user_count';
const SHEET_MESSAGES = 'messages';

export interface SpreadSheetRepository {
  getStrictMessage(count: number): string;
  incrementUserCount(userName: string): number;
  saveMessage(clientMsgId: string, messageTs: string, status: string): void;
  getMessageByTs(messageTs: string): {
    clientMsgId: string;
    messageTs: string;
    status: string;
    timestamp: string;
  } | null;
  updateMessageStatus(messageTs: string, status: string): void;
}

export class SpreadSheetRepositoryImpl implements SpreadSheetRepository {
  private strictMessagesSheet: GoogleAppsScript.Spreadsheet.Sheet;
  private userCountSheet: GoogleAppsScript.Spreadsheet.Sheet;
  private messagesSheet: GoogleAppsScript.Spreadsheet.Sheet;

  constructor() {
    const spreadsheet = SpreadsheetApp.openById(getSpreadSheetId());
    this.strictMessagesSheet = spreadsheet.getSheetByName(
      SHEET_STRICT_MESSAGES
    )!;
    this.userCountSheet = spreadsheet.getSheetByName(SHEET_USER_COUNT)!;
    this.messagesSheet = spreadsheet.getSheetByName(SHEET_MESSAGES)!;
  }

  getStrictMessage(count: number): string {
    const lastRow: number = this.strictMessagesSheet.getLastRow();
    // count % lastRow が 0 になった場合は最後の行を使う
    const row: number = count % lastRow || lastRow;
    const result: string = this.strictMessagesSheet
      .getRange(row, 1)
      .getValue() as string;
    return result;
  }

  incrementUserCount(userName: string): number {
    const data: (string | number | boolean | Date)[][] = this.userCountSheet
      .getDataRange()
      .getValues(); // 全データ取得

    for (let i = 1; i < data.length; i++) {
      // 1行目はヘッダ
      if (data[i][0] === userName) {
        // 見つかったらカウント +1
        const incrementCount: number = (data[i][1] as number) + 1;
        this.userCountSheet.getRange(i + 1, 2).setValue(incrementCount);
        return incrementCount;
      }
    }

    // 見つからなければ最後に追記
    this.userCountSheet.appendRow([userName, 1]);
    return 1;
  }

  saveMessage(clientMsgId: string, messageTs: string, status: string): void {
    const timestamp = new Date().toISOString();
    // messageTs を文字列として明示的に保存（数値に変換されないように）
    const row = [clientMsgId, "'" + messageTs, status, timestamp];
    this.messagesSheet.appendRow(row);
  }

  getMessageByTs(messageTs: string): {
    clientMsgId: string;
    messageTs: string;
    status: string;
    timestamp: string;
  } | null {
    const data: (string | number | boolean | Date)[][] = this.messagesSheet
      .getDataRange()
      .getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === messageTs) {
        return {
          clientMsgId: data[i][0] as string,
          messageTs: data[i][1] as string,
          status: data[i][2] as string,
          timestamp: data[i][3] as string,
        };
      }
    }

    return null;
  }

  updateMessageStatus(messageTs: string, status: string): void {
    const data: (string | number | boolean | Date)[][] = this.messagesSheet
      .getDataRange()
      .getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim() === messageTs) {
        this.messagesSheet.getRange(i + 1, 3).setValue(status);
        break;
      }
    }
  }
}
