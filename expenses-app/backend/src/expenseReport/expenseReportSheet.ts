import {
  convertCommuteToRowData,
  convertExpenseToRowData,
  formatYearMonth,
} from '../utils';
import { ExpenseEntry, CommuteEntry, ExpenseEntryRecord } from '../types/type';
import {
  EXPENSE_REPORT_SHEET_NAME,
  BORDER_SOLID,
  BORDER_MEDIUM,
} from './expensesReportTypes';
import {
  addSpreadsheetToFolder,
  uploadFileToFolderById,
  getOrCreateChildFolder,
  getTargetFolder,
} from '../drive';
import { initializeExpenseReportSheet } from './expenseReportSheetFormat';

// ユーザ毎の経費精算書ブックを取得または作成する
export function getOrCreateExpenseReportSS(
  userEmail: string,
  userName: string,
  date: Date
): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const yearMonth = formatYearMonth(date);
  const spreadsheetName = `${EXPENSE_REPORT_SHEET_NAME}_${userName || userEmail}_${yearMonth}`;
  const targetFolder = getTargetFolder(
    'EXPENSE_REPORT_FOLDER_ID',
    userEmail,
    date
  );

  // 経費精算書フォルダ内で既存のスプレッドシートを検索
  try {
    const files = targetFolder.getFilesByName(spreadsheetName);

    // 同名のファイルが見つかった場合、最初のものを使用
    if (files.hasNext()) {
      const file = files.next();
      return SpreadsheetApp.openById(file.getId());
    }
  } catch (error) {
    console.warn(
      `既存のスプレッドシート検索中にエラーが発生しました: ${(error as Error).message}`
    );
  }

  // 既存のスプレッドシートが見つからない場合、新規作成
  const expenseReport = SpreadsheetApp.create(spreadsheetName);

  // 最初のシートを経費精算書として初期化
  const firstSheet = expenseReport.getSheets()[0];
  firstSheet.setName(EXPENSE_REPORT_SHEET_NAME);
  initializeExpenseReportSheet(firstSheet, userName, date);

  // スプレッドシートの変更を確実にコミット
  SpreadsheetApp.flush();

  // Google Driveがファイルを認識するまで少し待機
  Utilities.sleep(2000);

  // 経費精算書フォルダに追加
  addSpreadsheetToFolder(
    expenseReport,
    'EXPENSE_REPORT_FOLDER_ID',
    targetFolder.getId()
  );

  return expenseReport;
}

// 月次経費精算書シートに交通費・経費データを追加する
export function addDateToExpenseReportSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  commuteEntries: CommuteEntry[],
  expenseEntries: ExpenseEntryRecord[]
): void {
  const MINIMUM_DATA_ROWS = 15;
  // 交通費と経費を結合
  const commuteRows = commuteEntries.map(convertCommuteToRowData);
  const expenseRows = expenseEntries.map(convertExpenseToRowData);
  const allRows = [...commuteRows, ...expenseRows];

  if (allRows.length === 0) {
    return;
  }

  // 既存のデータ行数を取得（10行目から開始）
  const startRow = 10;
  const lastRow = sheet.getLastRow();
  let currentRowNumber = lastRow >= startRow ? lastRow - startRow + 2 : 1;
  const additionalOffset = lastRow >= startRow ? lastRow - startRow + 1 : 0;
  const dataStartRow = startRow + additionalOffset;
  const dataRowCount = Math.max(allRows.length, MINIMUM_DATA_ROWS);

  // データを追加
  for (let index = 0; index < dataRowCount; index++) {
    const rowIndex = startRow + index + additionalOffset;
    const rowData = allRows[index];

    // A列: 番号
    sheet.getRange(rowIndex, 1).setValue(currentRowNumber);

    if (rowData) {
      // B列: 日付
      if (rowData.date) {
        sheet.getRange(rowIndex, 2).setValue(rowData.date);
        sheet.getRange(rowIndex, 2).setNumberFormat('yyyy/mm/dd');
      }

      // C列: 内容
      sheet.getRange(rowIndex, 3).setValue(rowData.description);

      // D列: 金額
      sheet.getRange(rowIndex, 4).setValue(rowData.amount);
      sheet.getRange(rowIndex, 4).setNumberFormat('¥#,##0');
    } else {
      // 足りない行は空欄を確保する（番号のみ表示）
      sheet.getRange(rowIndex, 2, 1, 3).clearContent();
    }

    currentRowNumber++;
  }

  // 追加したデータ範囲に罫線を引く
  const dataRange = sheet.getRange(dataStartRow, 1, dataRowCount, 4);
  const centerRange = sheet.getRange(dataStartRow, 1, dataRowCount, 1);
  centerRange.setHorizontalAlignment('center');
  // データ行全体
  dataRange
    .setBorder(
      false,
      true,
      true,
      true,
      true,
      true,
      null,
      SpreadsheetApp.BorderStyle.SOLID
    )
    .setFontSize(11)
    .setVerticalAlignment('middle');

  // 右側（D列）だけ太線にする
  const rightEdgeRange = sheet.getRange(dataStartRow, 4, dataRowCount, 1);
  rightEdgeRange.setBorder(
    null,
    null,
    null,
    true,
    null,
    null,
    null,
    SpreadsheetApp.BorderStyle.SOLID_MEDIUM
  );

  // 合計金額行を追加
  const totalRow = dataStartRow + dataRowCount;
  const totalAmount = allRows.reduce((sum, row) => sum + row.amount, 0);

  // A:C列に「合計金額」を結合して表示
  const totalLabelRange = sheet.getRange(totalRow, 1, 1, 3);
  totalLabelRange.merge();
  totalLabelRange.setFontWeight('bold');
  totalLabelRange.setFontSize(12);
  totalLabelRange.setValue('合計金額');
  totalLabelRange.setHorizontalAlignment('center');
  totalLabelRange.setVerticalAlignment('middle');
  totalLabelRange.setBackground('#0070C0');
  totalLabelRange.setFontColor('white');

  // D列に合計金額を表示
  sheet.getRange(totalRow, 4).setValue(totalAmount);
  sheet.getRange(totalRow, 4).setNumberFormat('¥#,##0');
  sheet.getRange(totalRow, 4).setFontWeight('bold');
  sheet.getRange(totalRow, 4).setFontSize(14);

  // 合計金額行に罫線を引く
  const totalRowRange = sheet.getRange(totalRow, 1, 1, 4);
  totalRowRange
    .setBorder(true, true, true, true, true, true, null, BORDER_SOLID)
    .setBorder(null, true, true, true, null, null, null, BORDER_MEDIUM);
}

// 経費の添付ファイルをアップロードしダウンロードURLを付与する
export function uploadExpenseReceipts(
  entries: ExpenseEntry[],
  userEmail: string,
  date: Date
): ExpenseEntryRecord[] {
  if (!entries || entries.length === 0) {
    return [];
  }

  // ユーザー毎のフォルダを取得
  const userFolder = getTargetFolder(
    'EXPENSE_REPORT_FOLDER_ID',
    userEmail,
    date
  );

  // 領収書フォルダを作成または取得
  const receiptFolder = getOrCreateChildFolder(userFolder, '領収書');
  const receiptFolderId = receiptFolder.getId();

  return entries.map(entry => {
    const category = entry.category || 'other';
    const receiptUrl = entry.receiptFile
      ? uploadFileToFolderById(entry.receiptFile, receiptFolderId)
      : '';
    const certificateUrl =
      category === 'certification' && entry.certificateFile
        ? uploadFileToFolderById(entry.certificateFile, receiptFolderId)
        : '';

    return {
      date: entry.date,
      category,
      description: entry.description,
      amount: entry.amount,
      receiptUrl,
      certificateUrl,
    };
  });
}
