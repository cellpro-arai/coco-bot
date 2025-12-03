/**
 * 登録日時から既存レコードの行番号を検索
 */
function findIncidentRowByDate(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  registeredDate: string
): number {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return -1;
  }

  const dateRange = sheet.getRange(2, 1, lastRow - 1, 1);
  const dateValues = dateRange.getValues();

  for (let i = 0; i < dateValues.length; i++) {
    if (dateValues[i][0]) {
      const cellDate = new Date(dateValues[i][0]).toLocaleString('ja-JP');
      if (cellDate === registeredDate) {
        return i + 2;
      }
    }
  }

  return -1;
}
