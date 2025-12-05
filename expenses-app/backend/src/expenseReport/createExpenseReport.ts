import {
  CommuteEntry,
  ExpenseData,
  ExpenseEntryRecord,
  EXPENSE_REPORT_SHEET_NAME,
} from '../types/type';
import {
  addDateToExpenseReportSheet,
  getOrCreateExpenseReportSS,
} from './expenseReportSheet';
import { initializeExpenseReportSheet } from './expenseReportSheetFormat';

// 提出者ごとに経費精算書スプレッドシートを作成する
export function createExpenseReport(
  expenseData: ExpenseData,
  userEmail: string,
  submittedDate: Date,
  commuteEntries: CommuteEntry[],
  expenseEntryRecords: ExpenseEntryRecord[]
): string {
  // 提出者ごとの経費精算書スプレッドシートを取得または作成
  const expenseReportSS = getOrCreateExpenseReportSS(
    userEmail,
    expenseData.name,
    submittedDate
  );
  const expenseReportSheet = expenseReportSS.getSheetByName(
    EXPENSE_REPORT_SHEET_NAME
  );

  if (!expenseReportSheet) {
    throw new Error('経費精算書シートの取得に失敗しました。');
  }

  // 既存の経費精算書シートをクリアして新規フォーマットで再初期化
  initializeExpenseReportSheet(
    expenseReportSheet,
    expenseData.name,
    submittedDate
  );

  // 経費精算書シートに交通費・経費データを追加
  addDateToExpenseReportSheet(
    expenseReportSheet,
    commuteEntries,
    expenseEntryRecords
  );

  // 経費精算書スプレッドシートのURLを返す
  return expenseReportSS.getUrl();
}
