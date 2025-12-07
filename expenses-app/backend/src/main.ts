import {
  ExpenseData,
  ExpenseResult,
  CommuteEntry,
  ExpenseEntryRecord,
} from './types/type';
import { parseSubmissionMonth } from './utils';
import { uploadWorkScheduleFiles, getUserFolderUrl } from './drive';
import { createExpenseReport } from './expenseReport/createExpenseReport';
import { uploadExpenseReceipts } from './expenseReport/expenseReportSheet';
import { saveToManagementSS } from './expenseManagement/saveManagementSheet';
import { initializeMonthlyExpenseSheet } from './expenseManagement/initializeMonthlySheet';

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

    // 勤務表ファイルをアップロード
    const workScheduleFiles = expenseData.workScheduleFiles || [];
    uploadWorkScheduleFiles(workScheduleFiles, userEmail, submittedMonth);

    // 勤務表フォルダのURLを取得（ファイルがある場合のみ）
    const workScheduleFolderUrl =
      workScheduleFiles.length > 0
        ? getUserFolderUrl('WORK_SCHEDULE_FOLDER_ID', userEmail, submittedMonth)
        : '';

    // 経費データを準備
    const commuteEntries: CommuteEntry[] = expenseData.commuteEntries || [];
    const expenseEntries = expenseData.expenseEntries || [];
    const expenseEntryRecords: ExpenseEntryRecord[] =
      uploadExpenseReceipts(expenseEntries, userEmail, submittedMonth);

    // 経費精算書を作成
    const hasExpenseData =
      commuteEntries.length > 0 || expenseEntryRecords.length > 0;
    if (hasExpenseData) {
      createExpenseReport(
        expenseData,
        userEmail,
        submittedMonth,
        commuteEntries,
        expenseEntryRecords
      );
    }

    // 経費精算書フォルダのURLを取得（データがある場合のみ）
    const expenseReportFolderUrl = hasExpenseData
      ? getUserFolderUrl(
          'EXPENSE_REPORT_FOLDER_ID',
          userEmail,
          submittedMonth
        )
      : '';

    saveToManagementSS(
      expenseData,
      userEmail,
      submittedMonth,
      workScheduleFolderUrl,
      expenseReportFolderUrl,
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
  window.initializeMonthlyExpenseSheet = initializeMonthlyExpenseSheet;
}
