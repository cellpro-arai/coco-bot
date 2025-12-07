import {
  getHeaderColumnPositions,
  getOrCreateExpenseManagementSheet,
  getOrCreateMonthlyManagementSpreadsheet,
  initializeEmployeeRows,
} from './expenseManagementSheetFormat';

/**
 * 指定月の管理シートを初期化する（時刻駆動トリガー用の公開関数）
 *
 * 従業員管理テーブルから有効な従業員を取得し、指定された年月の管理シートに
 * 初期行を投入します。既に存在する従業員はスキップされます。
 *
 * @param {number} [year] - 初期化する年（省略時は現在年）
 * @param {number} [month] - 初期化する月（省略時は現在月）
 * @returns {void}
 */
export function initializeMonthlyExpenseSheet(
  year?: number,
  month?: number
): void {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;

  Logger.log(`${targetYear}年${targetMonth}月の管理シートを初期化します。`);

  // 対象月のDateオブジェクトを作成
  const submissionMonth = new Date(targetYear, targetMonth - 1, 1);

  // 月別管理スプレッドシートを取得または作成
  const { spreadsheet: managementSS, isNewlyCreated } =
    getOrCreateMonthlyManagementSpreadsheet(submissionMonth);

  // 従業員の初期行を投入（既存シートのみ）
  if (!isNewlyCreated) {
    // 既存の管理シートのみ、従業員初期行を再投入（新規作成時は完了済み）
    const expenseSheet = getOrCreateExpenseManagementSheet(managementSS);
    const headerPositions = getHeaderColumnPositions(expenseSheet);
    initializeEmployeeRows(expenseSheet, headerPositions);
  }

  Logger.log(
    `${targetYear}年${targetMonth}月の管理シート初期化が完了しました。`
  );
}
