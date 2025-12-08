import { IncidentResult, IncidentRecord, INCIDENT_SHEET_NAME } from './types';
import { sendSlack } from '../slack/sendSlack';
import { getSpreadSheetId } from '../properties';

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

/**
 * インシデント管理シートを取得
 */
function getIncidentSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  const sheet = spreadsheet.getSheetByName(INCIDENT_SHEET_NAME);

  if (!sheet) {
    throw new Error(`シート「${INCIDENT_SHEET_NAME}」が見つかりません`);
  }

  return sheet;
}

/**
 * インシデントのステータスを更新します。
 * @param {string} registeredDate インシデント登録日時
 * @param {string} newStatus 新しいステータス
 * @returns {IncidentResult} 更新結果
 */
export function updateIncidentStatus(
  registeredDate: string,
  newStatus: string
): IncidentResult {
  try {
    const spreadSheetId = getSpreadSheetId();
    const spreadsheet = SpreadsheetApp.openById(spreadSheetId);
    const incidentSheet = getIncidentSheet(spreadsheet);

    // 対象行を検索
    const targetRow = findIncidentRowByDate(incidentSheet, registeredDate);
    if (targetRow === -1) {
      throw new Error('指定されたインシデントが見つかりません');
    }

    // 既存データを取得
    const row = incidentSheet.getRange(targetRow, 1, 1, 8);
    const values = row.getValues()[0];

    const oldStatus = values[4]; // ステータス列（5列目）
    const caseName = values[2]; // 案件名列（3列目）
    const assignee = values[3]; // 担当者列（4列目）
    const registeredUser = values[1]; // 登録ユーザー列（2列目）

    // ステータスを更新
    incidentSheet.getRange(targetRow, 5).setValue(newStatus);

    // 更新日時を更新
    const updateDateCell = incidentSheet.getRange(targetRow, 6);
    updateDateCell.setValue(new Date().toLocaleString('ja-JP'));

    // Slack通知
    sendSlack({
      caseName: caseName,
      assignee: assignee,
      oldStatus: oldStatus,
      newStatus: newStatus,
      originalUserEmail: registeredUser,
      isNewIncident: false,
    });

    // 戻り値を作成
    const record: IncidentRecord = {
      registeredDate: registeredDate,
      registeredUser: registeredUser,
      caseName: caseName,
      assignee: assignee,
      status: newStatus,
      updateDate: new Date().toLocaleString('ja-JP'),
      driveFolderUrl: values[6], // Drive格納先フォルダ列（7列目）
      incidentDetailUrl: values[7], // インシデント詳細列（8列目）
    };

    return {
      success: true,
      message: 'ステータスを更新しました',
      incidentDate: new Date().toISOString(),
      record: record,
    };
  } catch (error) {
    console.error('updateIncidentStatus error:', error);
    throw new Error(`ステータス更新エラー: ${(error as Error).message}`);
  }
}
