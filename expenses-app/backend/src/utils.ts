import { FolderPropertyKey, OfficeFrequency } from './types/type';
import { CommuteEntry, ExpenseEntryRecord } from './types/type';

// スクリプトプロパティを取得する共通関数
export function getScriptProperty(
  propertyName: string,
  errorMessage: string
): string {
  const scriptProperties = PropertiesService.getScriptProperties();
  const value = scriptProperties.getProperty(propertyName);

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

// フォルダの説明文を取得する
export function getFolderDescription(
  folderPropertyKey: FolderPropertyKey
): string {
  switch (folderPropertyKey) {
    case 'WORK_SCHEDULE_FOLDER_ID':
      return '作業表フォルダ';
    case 'EXPENSE_REPORT_FOLDER_ID':
      return '経費精算書フォルダ';
    default:
      // すべてのケースを網羅しているため、ここには到達しない
      const _exhaustiveCheck: never = folderPropertyKey;
      throw new Error(`未知のフォルダプロパティキー: ${_exhaustiveCheck}`);
  }
}

// 指定した日付から月の最終日を取得する
export function getLastDayOfMonth(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  // 翌月の0日 = 当月の最終日
  return new Date(year, month + 1, 0);
}

// 年月文字列を生成する（例: "2025年1月"）
export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}年${month}月`;
}

// 出社頻度を日本語ラベルに変換する
export function formatOfficeFrequency(frequency: OfficeFrequency): string {
  switch (frequency) {
    case 'fullRemote':
      return 'フルリモート';
    case 'weekly1to2':
      return '週1~2出社';
    case 'weekly3to5':
      return '週3~5出社';
    default:
      return frequency;
  }
}

// 定期区間の入力値を「最寄り駅-勤務先の駅」の形式に整形する
export function formatCommuterRoute(
  origin: string,
  destination: string
): string {
  return [origin, destination].filter(Boolean).join('-');
}

// 文字列の金額から数値のみ抽出して数値化する
export function toNumberAmount(value?: string): number {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

// 交通費エントリーの表示用データ行を作成する
export interface ExpenseRowData {
  date: string;
  description: string;
  amount: number;
}

// 交通費エントリーを表示用データに変換する
export function convertCommuteToRowData(entry: CommuteEntry): ExpenseRowData {
  const tripTypeLabel = entry.tripType === 'roundTrip' ? '往復' : '片道';
  const description = `${entry.origin}-${entry.destination} ${tripTypeLabel}`;

  // 片道の金額
  const oneWayAmount = toNumberAmount(entry.amount);

  // 往復の場合は2倍
  const amount =
    entry.tripType === 'roundTrip' ? oneWayAmount * 2 : oneWayAmount;

  return {
    date: entry.date,
    description,
    amount,
  };
}

// 経費エントリーを表示用データに変換する
export function convertExpenseToRowData(
  entry: ExpenseEntryRecord
): ExpenseRowData {
  return {
    date: entry.date,
    description: entry.description,
    amount: toNumberAmount(entry.amount),
  };
}

// 1つのセルに複数のハイパーリンクを設定する
export function setMultipleHyperlinks(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  row: number,
  column: number,
  links: Array<{ text: string; url: string }>
): void {
  if (!links || links.length === 0) {
    return;
  }

  // 1. 最初に全文を構築し、各リンクの位置を記録
  let fullText = '';
  const linkPositions: Array<{ start: number; end: number; url: string }> = [];
  let currentIndex = 0;

  links.forEach((link, index) => {
    if (index > 0) {
      fullText += ', ';
      currentIndex += 2;
    }

    const startIndex = currentIndex;
    fullText += link.text;
    currentIndex += link.text.length;

    linkPositions.push({
      start: startIndex,
      end: currentIndex,
      url: link.url,
    });
  });

  // 2. RichTextBuilderを作成してまずsetTextを呼び出す
  let richTextBuilder = SpreadsheetApp.newRichTextValue().setText(fullText);

  // 3. その後、各リンクにsetLinkUrlを呼び出す
  linkPositions.forEach(pos => {
    richTextBuilder = richTextBuilder.setLinkUrl(pos.start, pos.end, pos.url);
  });

  sheet.getRange(row, column).setRichTextValue(richTextBuilder.build());
}

// ファイル名を表示しつつURLのリンクをセルに設定する
export function setFileHyperlink(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  row: number,
  column: number,
  fileName?: string,
  url?: string
): void {
  if (!fileName || !url) {
    return;
  }

  const richTextBuilder = SpreadsheetApp.newRichTextValue()
    .setText(fileName)
    .setLinkUrl(url);
  sheet.getRange(row, column).setRichTextValue(richTextBuilder.build());
}

// ヘッダー位置マップに基づいて行データを追加する
export function appendRowWithHeaderPositions(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  headerPositions: Map<string, number>,
  dataMap: Map<string, string | number | Date>
): number {
  const newRow = sheet.getLastRow() + 1;

  dataMap.forEach((value, header) => {
    const column = headerPositions.get(header);
    if (column !== undefined) {
      sheet.getRange(newRow, column).setValue(value);
    }
  });

  return newRow;
}

// 提出月 (yyyy-mm) を Date に変換
export function parseSubmissionMonth(submissionMonth: string): Date {
  if (!submissionMonth) {
    return new Date();
  }

  const [yearStr, monthStr] = submissionMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return new Date();
  }

  return new Date(year, month - 1, 1);
}
