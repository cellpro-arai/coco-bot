import {
  COLOR_PRIMARY,
  COLOR_WHITE,
  BORDER_MEDIUM,
  BORDER_SOLID,
} from '../types/type';
import { getLastDayOfMonth } from '../utils';

// 月次経費精算書シートを指定フォーマットで初期化
export function initializeExpenseReportSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  userName: string,
  date: Date
): void {
  // 初期化
  sheet.clear();

  // タイトル
  const titleRange = sheet.getRange('A2:D3');
  titleRange
    .merge()
    .setValue('経費精算書')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBackground(COLOR_PRIMARY)
    .setFontColor(COLOR_WHITE)
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  // 申請日
  const b5 = sheet.getRange('B5');
  b5.setValue('申請日')
    .setFontSize(12)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBackground(COLOR_PRIMARY)
    .setFontColor(COLOR_WHITE)
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  const c5 = sheet.getRange('C5');
  c5.setValue(getLastDayOfMonth(date))
    .setNumberFormat('yyyy年mm月dd日')
    .setFontSize(14)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  // 氏名
  const b6 = sheet.getRange('B6');
  b6.setValue('氏名')
    .setFontSize(12)
    .setFontWeight('bold')
    .setBackground(COLOR_PRIMARY)
    .setFontColor(COLOR_WHITE)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  const c6 = sheet.getRange('C6');
  c6.setValue(userName)
    .setFontSize(14)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, null, BORDER_MEDIUM);

  // 明細ヘッダー
  const headerRange = sheet.getRange('A9:D9');
  headerRange
    .setValues([['番号', '日付', '内容', '金額']])
    .setFontWeight('bold')
    .setFontSize(12)
    .setBackground(COLOR_PRIMARY)
    .setFontColor(COLOR_WHITE)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, null, BORDER_SOLID)
    .setBorder(true, null, null, true, null, null, null, BORDER_MEDIUM);

  // 列幅調整
  sheet.setColumnWidth(1, 60); // A列: 番号
  sheet.setColumnWidth(2, 100); // B列: 日付
  sheet.setColumnWidth(3, 300); // C列: 内容
  sheet.setColumnWidth(4, 100); // D列: 金額
}
