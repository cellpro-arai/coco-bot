import { IncidentData, IncidentResult, IncidentRecord } from './incidentType';
import { extractSheetIdFromUrl, extractFolderIdFromUrl } from '../utils';
import { getOrCreateIncidentSheet } from './getOrCreateIncidentSheet';
import { findIncidentRowByDate } from './findIncidentRowByDate';
import { uploadFileToDrive } from '../drive';
import { sendSlack } from '../slack/sendSlack';
import { getAllPermissions } from '../permissions/permissionManager';
import {
  getUploadFolderId,
  getSpreadSheetId,
  getTemplateSheetId,
} from '../properties';

/**
 * インシデント情報をスプレッドシートに保存
 */
export function submitIncident(incidentData: IncidentData): IncidentResult {
  try {
    const spreadsheetId = getSpreadSheetId();
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const userEmail = Session.getEffectiveUser().getEmail();

    const incidentSheet = getOrCreateIncidentSheet(ss);

    const isEditMode = !!(
      incidentData.registeredDate && incidentData.registeredDate.trim()
    );
    let targetRow = -1;
    let incidentDate: Date;
    let originalUserEmail = userEmail;

    let driveFolderUrl = '';
    let incidentDetailUrl = '';
    let oldStatus = '';

    const updateDate = new Date();

    if (isEditMode) {
      targetRow = findIncidentRowByDate(
        incidentSheet,
        incidentData.registeredDate!
      );
      if (targetRow === -1) {
        throw new Error('編集対象のレコードが見つかりませんでした。');
      }
      const existingData = incidentSheet
        .getRange(targetRow, 1, 1, 8)
        .getValues()[0];
      incidentDate = new Date(existingData[0]);
      originalUserEmail = existingData[1] as string;
      driveFolderUrl = existingData[6] as string;
      incidentDetailUrl = existingData[7] as string;
    } else {
      incidentDate = new Date();

      const parentFolderId = getUploadFolderId();
      const parentFolder = DriveApp.getFolderById(parentFolderId);
      const folderName = `${
        incidentData.caseName
      }_${incidentDate.getFullYear()}${(incidentDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${incidentDate
        .getDate()
        .toString()
        .padStart(2, '0')}`;
      const newFolder = parentFolder.createFolder(folderName);
      driveFolderUrl = newFolder.getUrl();

      const adminUsers = getAllPermissions().filter(
        user => user.role === 'admin'
      );
      adminUsers.forEach(admin => {
        newFolder.addEditor(admin.email);
      });

      const templateSheetId = getTemplateSheetId();
      const templateFile = DriveApp.getFileById(templateSheetId);
      const newSheet = templateFile.makeCopy(
        `${incidentData.caseName}_詳細`,
        newFolder
      );
      incidentDetailUrl = newSheet.getUrl();

      const detailSheet = SpreadsheetApp.openById(newSheet.getId());
      const allSheets = detailSheet.getSheets();

      // テンプレートの最初のシートを取得（「詳細」または「シート1」など）
      const sheet = allSheets.length > 0 ? allSheets[0] : null;

      if (sheet) {
        sheet.getRange('B1').setValue(incidentData.summary);
        sheet.getRange('B2').setValue(incidentData.stakeholders);
        sheet.getRange('B3').setValue(incidentData.details);

        if (incidentData.fileDataList && incidentData.fileDataList.length > 0) {
          const folderId = newFolder.getId();
          const cell = sheet.getRange('B4');
          const richTextBuilder = SpreadsheetApp.newRichTextValue();
          let text = '';

          incidentData.fileDataList.forEach((fileData, index) => {
            const fileUrl = uploadFileToDrive(fileData, folderId);
            const fileName = fileData.name;
            if (index > 0) {
              text += '\n';
            }
            const startOffset = text.length;
            text += fileName;
            const endOffset = text.length;
            richTextBuilder.setText(text);
            richTextBuilder.setLinkUrl(startOffset, endOffset, fileUrl);
          });
          cell.setRichTextValue(richTextBuilder.build());
        }
      } else {
        console.error('詳細シートが見つかりません');
      }

      targetRow = incidentSheet.getLastRow() + 1;
      incidentSheet.appendRow([
        incidentDate,
        userEmail,
        incidentData.caseName,
        incidentData.assignee,
        incidentData.status,
        updateDate,
        driveFolderUrl,
        incidentDetailUrl,
      ]);
    }

    if (isEditMode) {
      const existingData = incidentSheet
        .getRange(targetRow, 1, 1, 8)
        .getValues()[0];
      oldStatus = existingData[4] as string;

      incidentSheet
        .getRange(targetRow, 3, 1, 4)
        .setValues([
          [
            incidentData.caseName,
            incidentData.assignee,
            incidentData.status,
            updateDate,
          ],
        ]);

      if (incidentDetailUrl) {
        const detailSheetId = extractSheetIdFromUrl(incidentDetailUrl);
        const detailSheet = SpreadsheetApp.openById(detailSheetId);
        const sheet = detailSheet.getSheetByName('詳細');
        if (sheet) {
          sheet.getRange('B1').setValue(incidentData.summary);
          sheet.getRange('B2').setValue(incidentData.stakeholders);
          sheet.getRange('B3').setValue(incidentData.details);

          if (
            incidentData.fileDataList &&
            incidentData.fileDataList.length > 0
          ) {
            const folderId = extractFolderIdFromUrl(driveFolderUrl);
            const cell = sheet.getRange('B4');
            const richTextBuilder = SpreadsheetApp.newRichTextValue();
            let text = '';

            incidentData.fileDataList.forEach((fileData, index) => {
              const fileUrl = uploadFileToDrive(fileData, folderId);
              const fileName = fileData.name;
              if (index > 0) {
                text += '\n';
              }
              const startOffset = text.length;
              text += fileName;
              const endOffset = text.length;
              richTextBuilder.setText(text);
              richTextBuilder.setLinkUrl(startOffset, endOffset, fileUrl);
            });
            cell.setRichTextValue(richTextBuilder.build());
          }
        }
      }
    }

    // Slack通知
    sendSlack({
      caseName: incidentData.caseName,
      assignee: incidentData.assignee,
      oldStatus: oldStatus,
      newStatus: incidentData.status,
      incidentDetailUrl: incidentDetailUrl,
      originalUserEmail: originalUserEmail,
      isNewIncident: !isEditMode,
    });

    const record: IncidentRecord = {
      registeredDate: incidentDate.toLocaleString('ja-JP'),
      registeredUser: originalUserEmail,
      caseName: incidentData.caseName,
      assignee: incidentData.assignee,
      status: incidentData.status,
      updateDate: updateDate.toLocaleString('ja-JP'),
      driveFolderUrl: driveFolderUrl,
      incidentDetailUrl: incidentDetailUrl,
    };

    return {
      success: true,
      message: 'インシデント情報を登録しました',
      incidentDate: incidentDate.toISOString(),
      record: record,
    };
  } catch (error) {
    console.error('submitIncident error:', error);
    throw new Error(`登録処理エラー: ${(error as Error).message}`);
  }
}
