import { CommuteEntry, ExpenseData, ExpenseEntryRecord } from '../types/type';
import {
  getScriptProperty,
  formatCommuterRoute,
  formatOfficeFrequency,
  setMultipleHyperlinks,
  setFileHyperlink,
  appendRowWithHeaderPositions,
} from '../utils';
import {
  getHeaderColumnPositions,
  getOrCreateExpenseManagementSheet,
} from './expenseManagementSheetFormat';

// 全体マネジメントシートに経費精算情報を登録する
export function saveToManagementSS(
  expenseData: ExpenseData,
  userEmail: string,
  workScheduleUrls: string[],
  expenseReportSSUrl: string,
  commuteEntries: CommuteEntry[],
  expenseEntryRecords: ExpenseEntryRecord[]
): void {
  const managementSSId = getScriptProperty(
    'SPREADSHEET_ID',
    'スプレッドシートIDが設定されていません。'
  );
  const managementSS = SpreadsheetApp.openById(managementSSId);
  const expenseSheet = getOrCreateExpenseManagementSheet(managementSS);

  const commuterRoute = formatCommuterRoute(
    expenseData.nearestStation,
    expenseData.workStation
  );

  // 領収書リンクのリストを作成
  const receiptLinks = buildReceiptLinks(expenseEntryRecords);

  // 提出がない場合のチェック
  const hasWorkSchedule = workScheduleUrls.length > 0;
  const hasReceipts = receiptLinks.length > 0;
  const hasExpenseData =
    commuteEntries.length > 0 || expenseEntryRecords.length > 0;

  // ヘッダー位置を検出
  const headerPositions = getHeaderColumnPositions(expenseSheet);

  // データマップを作成
  const dataMap = buildManagementDataMap(
    expenseData,
    userEmail,
    hasWorkSchedule,
    hasExpenseData,
    hasReceipts,
    commuterRoute
  );

  // 新規行を追加
  const lastRow = appendRowWithHeaderPositions(
    expenseSheet,
    headerPositions,
    dataMap
  );

  // 提出日時列に日時形式を設定
  // 提出日時列のフォーマットはTableビューが管理するため何もしない

  // 勤務表列に複数のハイパーリンクを設定（提出がある場合のみ）
  if (hasWorkSchedule) {
    const column = headerPositions.get('勤務表');
    if (column) {
      const files = expenseData.workScheduleFiles || [];
      const workScheduleLinks = files.map((file, index) => ({
        text: file.name || `勤務表${index + 1}`,
        url: workScheduleUrls[index],
      }));
      setMultipleHyperlinks(expenseSheet, lastRow, column, workScheduleLinks);
    }
  }

  // 経費精算書列にハイパーリンクを設定（データがある場合のみ）
  if (hasExpenseData) {
    const column = headerPositions.get('経費精算書');
    if (column) {
      setFileHyperlink(
        expenseSheet,
        lastRow,
        column,
        '経費精算書',
        expenseReportSSUrl
      );
    }
  }

  // 領収書列に複数のハイパーリンクを設定（提出がある場合のみ）
  if (hasReceipts) {
    const column = headerPositions.get('領収書');
    if (column) {
      setMultipleHyperlinks(expenseSheet, lastRow, column, receiptLinks);
    }
  }
}

// 領収書リンクのリストを作成
type LinkItem = { text: string; url: string };
function buildReceiptLinks(
  records: ExpenseEntryRecord[]
): Array<{ text: string; url: string }> {
  return records.reduce<Array<LinkItem>>((links, entry, index) => {
    if (entry.receiptUrl) {
      links.push({
        text: `領収書${index + 1}`,
        url: entry.receiptUrl,
      });
    }
    if (entry.certificateUrl) {
      links.push({
        text: `合格通知書${index + 1}`,
        url: entry.certificateUrl,
      });
    }
    return links;
  }, []);
}

// 全体マネジメントシートに経費精算情報を登録する
function buildManagementDataMap(
  expenseData: ExpenseData,
  userEmail: string,
  hasWorkSchedule: boolean,
  hasExpenseData: boolean,
  hasReceipts: boolean,
  commuterRoute: string
): Map<string, string | number | Date> {
  const dataMap = new Map<string, string | number | Date>();
  dataMap.set('提出日時', new Date());
  dataMap.set('提出者', userEmail);
  dataMap.set('氏名', expenseData.name);
  dataMap.set('提出月', expenseData.submissionMonth);
  dataMap.set('勤務表', hasWorkSchedule ? '勤務表' : '提出なし');
  dataMap.set('経費精算書', hasExpenseData ? '経費精算書' : '提出なし');
  dataMap.set('領収書', hasReceipts ? '領収書' : '提出なし');
  dataMap.set('開始時間', expenseData.workStartTime);
  dataMap.set('終了時間', expenseData.workEndTime);
  dataMap.set('出社頻度', formatOfficeFrequency(expenseData.officeFrequency));
  dataMap.set(
    '定期券購入',
    expenseData.hasCommuterPass === 'yes' ? '有り' : '無し'
  );
  dataMap.set('定期区間', commuterRoute);
  dataMap.set('定期券金額', expenseData.monthlyFee);
  dataMap.set('備考', expenseData.remarks);
  return dataMap;
}
