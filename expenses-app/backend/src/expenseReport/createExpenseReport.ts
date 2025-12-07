import { CommuteEntry, ExpenseData, ExpenseEntryRecord } from '../types/type';
import { EXPENSE_REPORT_SHEET_NAME } from './expensesReportTypes';
import {
  addDateToExpenseReportSheet,
  createExpenseReportSS,
} from './expenseReportSheet';

/**
 * 提出データから経費精算書スプレッドシートを新規作成する。
 * @param expenseData - フォーム入力データ。
 * @param userEmail - 提出者メールアドレス。
 * @param submittedDate - 提出対象月。
 * @param commuteEntries - 交通費エントリー。
 * @param expenseEntryRecords - 経費エントリー（アップロード結果）。
 * @returns 作成した経費精算書のURL。
 */
export function createExpenseReport(
  expenseData: ExpenseData,
  userEmail: string,
  submittedDate: Date,
  commuteEntries: CommuteEntry[],
  expenseEntryRecords: ExpenseEntryRecord[]
): string {
  // 提出者ごとの経費精算書スプレッドシートを新規作成
  const expenseReportSS = createExpenseReportSS(
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

  // 経費精算書シートに交通費・経費データを追加
  addDateToExpenseReportSheet(
    expenseReportSheet,
    commuteEntries,
    expenseEntryRecords
  );

  // 経費精算書スプレッドシートのURLを返す
  return expenseReportSS.getUrl();
}
