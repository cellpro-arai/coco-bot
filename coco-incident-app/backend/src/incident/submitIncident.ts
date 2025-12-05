import {
  IncidentData,
  IncidentResult,
  IncidentRecord,
  INCIDENT_SHEET_NAME,
} from './types';
import { extractSheetIdFromUrl, extractFolderIdFromUrl } from './utils';
import { uploadFile } from '../drive/uploadFile';
import { copyFile } from '../drive/copyTemplate';
import { sendSlack } from '../slack/sendSlack';
import { getAllPermissions } from '../permissions/permissionManager';
import { USER_ROLE } from '../permissions/constants';
import {
  getUploadFolderId,
  getSpreadSheetId,
  getTemplateSheetId,
} from '../properties';

interface NewIncidentContext {
  incidentDate: Date;
  driveFolderUrl: string;
  incidentDetailUrl: string;
  targetRow: number;
  oldStatus?: undefined;
  originalUserEmail?: undefined;
}

interface EditIncidentContext {
  incidentDate: Date;
  driveFolderUrl: string;
  incidentDetailUrl: string;
  targetRow: number;
  oldStatus: string;
  originalUserEmail: string;
}

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
 * インシデント管理シートを取得または作成
 */
function getOrCreateIncidentSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = spreadsheet.getSheetByName(INCIDENT_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(INCIDENT_SHEET_NAME);
    sheet.appendRow([
      '登録日時',
      '登録ユーザー',
      '案件名',
      '担当者',
      'ステータス',
      '更新日時',
      'Drive格納先フォルダ',
      'インシデント詳細',
    ]);
  }

  return sheet;
}

/**
 * 詳細シートを取得（見つからない場合はエラー）
 */
function getDetailSheet(
  detailSheetUrl: string,
  sheetName: string = '詳細'
): GoogleAppsScript.Spreadsheet.Sheet {
  const detailSheetId = extractSheetIdFromUrl(detailSheetUrl);
  const detailSheet = SpreadsheetApp.openById(detailSheetId);
  const sheet = detailSheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`シート「${sheetName}」が見つかりません`);
  }

  return sheet;
}

/**
 * 詳細シートにデータを設定
 */
function setDetailSheetData(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  incidentData: IncidentData,
  folderId: string
): void {
  sheet.getRange('B1').setValue(incidentData.summary);
  sheet.getRange('B2').setValue(incidentData.stakeholders);
  sheet.getRange('B3').setValue(incidentData.details);

  if (!incidentData.fileDataList || incidentData.fileDataList.length === 0) {
    return;
  }

  const cell = sheet.getRange('B4');
  const richTextBuilder = SpreadsheetApp.newRichTextValue();
  let text = '';

  incidentData.fileDataList.forEach((fileData, index) => {
    const fileUrl = uploadFile(fileData, folderId);
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

/**
 * 新規インシデント作成処理
 */
function createNewIncident(
  incidentSheet: GoogleAppsScript.Spreadsheet.Sheet,
  incidentData: IncidentData,
  userEmail: string
): NewIncidentContext {
  const incidentDate = new Date();
  const updateDate = new Date();

  // フォルダ作成
  const parentFolderId = getUploadFolderId();
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  const folderName = `${incidentData.caseName}_${incidentDate.getFullYear()}${(
    incidentDate.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}${incidentDate.getDate().toString().padStart(2, '0')}`;
  const newFolder = parentFolder.createFolder(folderName);
  const driveFolderUrl = newFolder.getUrl();

  // 管理者に権限付与
  const adminUsers = getAllPermissions().filter(
    user => user.role === USER_ROLE.ADMIN
  );
  adminUsers.forEach(admin => {
    newFolder.addEditor(admin.email);
  });

  // テンプレートをコピー
  const templateSheetId = getTemplateSheetId();
  const incidentDetailUrl = copyFile(
    templateSheetId,
    `${incidentData.caseName}_詳細`,
    newFolder
  );

  // 詳細シート初期化
  const detailSheet = SpreadsheetApp.openById(
    extractSheetIdFromUrl(incidentDetailUrl)
  );
  const allSheets = detailSheet.getSheets();
  if (allSheets.length === 0) {
    throw new Error('テンプレートシートが見つかりません');
  }

  const sheet = allSheets[0];
  setDetailSheetData(sheet, incidentData, newFolder.getId());

  // 管理シートに追加
  const targetRow = incidentSheet.getLastRow() + 1;
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

  return {
    incidentDate,
    driveFolderUrl,
    incidentDetailUrl,
    targetRow,
  };
}

/**
 * 既存インシデント編集処理
 */
function editExistingIncident(
  incidentSheet: GoogleAppsScript.Spreadsheet.Sheet,
  incidentData: IncidentData,
  registeredDate: string
): EditIncidentContext {
  const updateDate = new Date();

  const targetRow = findIncidentRowByDate(incidentSheet, registeredDate);
  if (targetRow === -1) {
    throw new Error('編集対象のレコードが見つかりませんでした。');
  }

  const existingData = incidentSheet
    .getRange(targetRow, 1, 1, 8)
    .getValues()[0];
  const incidentDate = new Date(existingData[0]);
  const originalUserEmail = existingData[1] as string;
  const driveFolderUrl = existingData[6] as string;
  const incidentDetailUrl = existingData[7] as string;
  const oldStatus = existingData[4] as string;

  // 管理シートを更新
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

  // 詳細シートを更新
  const sheet = getDetailSheet(incidentDetailUrl, '詳細');
  const folderId = extractFolderIdFromUrl(driveFolderUrl);
  setDetailSheetData(sheet, incidentData, folderId);

  return {
    incidentDate,
    originalUserEmail,
    driveFolderUrl,
    incidentDetailUrl,
    oldStatus,
    targetRow,
  };
}

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

    // 新規/編集処理を実行
    const context = isEditMode
      ? editExistingIncident(
          incidentSheet,
          incidentData,
          incidentData.registeredDate!
        )
      : createNewIncident(incidentSheet, incidentData, userEmail);

    const registeredUserEmail = context.originalUserEmail ?? userEmail;

    // Slack通知
    sendSlack({
      caseName: incidentData.caseName,
      assignee: incidentData.assignee,
      oldStatus: context.oldStatus ?? '',
      newStatus: incidentData.status,
      originalUserEmail: registeredUserEmail,
      isNewIncident: !isEditMode,
    });

    // 戻り値を作成
    const record: IncidentRecord = {
      registeredDate: context.incidentDate.toLocaleString('ja-JP'),
      registeredUser: registeredUserEmail,
      caseName: incidentData.caseName,
      assignee: incidentData.assignee,
      status: incidentData.status,
      updateDate: new Date().toLocaleString('ja-JP'),
      driveFolderUrl: context.driveFolderUrl,
      incidentDetailUrl: context.incidentDetailUrl,
    };

    return {
      success: true,
      message: 'インシデント情報を登録しました',
      incidentDate: context.incidentDate.toISOString(),
      record: record,
    };
  } catch (error) {
    console.error('submitIncident error:', error);
    throw new Error(`登録処理エラー: ${(error as Error).message}`);
  }
}
