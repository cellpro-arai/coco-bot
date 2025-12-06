import {
  ExpenseData,
  ExpenseResult,
  CommuteEntry,
  ExpenseEntryRecord,
} from './types/type';
import { parseSubmissionMonth } from './utils';
import { uploadFileToDrive } from './drive';
import { createExpenseReport } from './expenseReport/createExpenseReport';
import { uploadExpenseReceipts } from './expenseReport/expenseReportSheet';
import { saveToManagementSS } from './expenseManagement/saveManagementSheet';

// WebアプリのGETリクエスト処理
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile('index').setTitle(
    '経費精算フォーム'
  );
}

/**
 * 経費精算フォームを提出する（フロントエンドから呼び出される）
 */
function submitExpense(expenseData: ExpenseData): ExpenseResult {
  try {
    const userEmail = Session.getEffectiveUser().getEmail();
    const submittedAt = new Date();
    const submittedMonth = parseSubmissionMonth(expenseData.submissionMonth);

    const workScheduleFiles = expenseData.workScheduleFiles || [];
    const workScheduleUrls = workScheduleFiles.map(file =>
      uploadFileToDrive(file, 'WORK_SCHEDULE_FOLDER_ID')
    );

    const commuteEntries: CommuteEntry[] = expenseData.commuteEntries || [];
    const expenseEntries = expenseData.expenseEntries || [];
    const expenseEntryRecords: ExpenseEntryRecord[] =
      uploadExpenseReceipts(expenseEntries, userEmail, submittedMonth);

    const expenseReportSSUrl = createExpenseReport(
      expenseData,
      userEmail,
      submittedMonth,
      commuteEntries,
      expenseEntryRecords
    );

    saveToManagementSS(
      expenseData,
      userEmail,
      workScheduleUrls,
      expenseReportSSUrl,
      commuteEntries,
      expenseEntryRecords
    );

    return {
      success: true,
      message: '経費精算フォームを提出しました',
      submittedDate: submittedAt.toISOString(),
    };
  } catch (error) {
    console.error('submitExpense error:', error);
    throw new Error(`登録処理エラー: ${(error as Error).message}`);
  }
}

/**
 * GASのグローバルスコープに関数を登録
 */
declare const window: any;

if (typeof window !== 'undefined') {
  window.doGet = doGet;
  window.submitExpense = submitExpense;
}
