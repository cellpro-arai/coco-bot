import { INCIDENT_SHEET_NAME, IncidentRecord } from './types';
import { extractSheetIdFromUrl } from './utils';
import { getCurrentUserAndAll } from '../user/permissionManager';
import { USER_ROLE } from '../user/constants';
import { getSpreadSheetId } from '../properties';

/**
 * インシデント一覧を取得
 */
export function getIncidentList(): IncidentRecord[] {
  try {
    const spreadsheetId = getSpreadSheetId();
    const ss = SpreadsheetApp.openById(spreadsheetId);

    const userInfo = getCurrentUserAndAll();
    const userIsAdmin = userInfo.role === USER_ROLE.ADMIN;

    const incidentSheet = ss.getSheetByName(INCIDENT_SHEET_NAME);
    if (!incidentSheet) {
      return [];
    }

    const lastRow = incidentSheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }

    let values = incidentSheet.getRange(2, 1, lastRow - 1, 8).getValues();

    // 管理者は全件表示、一般ユーザーは自分が登録したもののみ表示
    if (!userIsAdmin) {
      values = values.filter(row => row[1] === userInfo.current_user);
    }

    const records: IncidentRecord[] = [];

    for (let i = values.length - 1; i >= 0; i--) {
      const row = values[i];

      const record: IncidentRecord = {
        registeredDate: row[0] ? new Date(row[0]).toLocaleString('ja-JP') : '',
        registeredUser: row[1] || '',
        caseName: row[2] || '',
        assignee: row[3] || '',
        status: row[4] || '',
        updateDate: row[5] ? new Date(row[5]).toLocaleString('ja-JP') : '',
        driveFolderUrl: row[6] || '',
        incidentDetailUrl: row[7] || '',
      };

      if (record.incidentDetailUrl) {
        try {
          const detailSheetId = extractSheetIdFromUrl(record.incidentDetailUrl);
          const detailSpreadsheet = SpreadsheetApp.openById(detailSheetId);
          const allSheets = detailSpreadsheet.getSheets();

          // テンプレートの最初のシートを取得（「詳細」または「シート1」など）
          const detailSheet = allSheets.length > 0 ? allSheets[0] : null;

          if (detailSheet) {
            const detailValues = detailSheet.getRange('B1:B4').getValues();
            record.summary = detailValues[0][0];
            record.stakeholders = detailValues[1][0];
            record.details = detailValues[2][0];
            record.attachments = detailSheet
              .getRange('B4')
              .getRichTextValue()
              ?.getText();
          }
        } catch (e) {
          console.error(
            `詳細シートの読み込みに失敗しました: ${record.incidentDetailUrl}`,
            e
          );
          // 詳細が取得できなくてもエラーにはせず、取得できた情報だけで続行
        }
      }
      records.push(record);
    }

    return records;
  } catch (error) {
    console.error('getIncidentList error:', error);
    throw new Error(`一覧取得エラー: ${(error as Error).message}`);
  }
}
