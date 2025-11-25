/**
 * ========================================
 * インシデント管理フォーム
 * ========================================
 *
 * 【セットアップ手順】
 * 1. Google Apps Scriptで新規プロジェクトを作成
 * 2. このmain.tsとindex.htmlをプロジェクトに追加
 * 3. 以下をスクリプトプロパティに設定
 *    - SPREADSHEET_ID: インシデント管理用スプレッドシートのID
 *    - TEMPLATE_SHEET_ID: インシデント詳細用テンプレートスプレッドシートのID
 *    - UPLOAD_FOLDER_ID: インシデントファイルアップロード先のGoogle DriveフォルダID
 * 4. Webアプリとしてデプロイ（アクセス: 組織 *開発時は自分のみ）
 *
 * ========================================
 */

/**
 * ファイルデータの型定義
 */
interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded
}

/**
 * インシデントデータの型定義
 */
interface IncidentData {
  registeredDate?: string; // 編集時のみ設定される（既存レコードの識別子）
  caseName: string;
  assignee: string;
  summary: string;
  stakeholders: string;
  details: string;
  status: string;
  fileDataList: FileData[];
}

/**
 * インシデント登録結果の型定義
 */
interface IncidentResult {
  success: boolean;
  message: string;
  incidentDate: string;
  record: IncidentRecord;
}

/**
 * インシデント一覧取得用の型定義
 */
interface IncidentRecord {
  registeredDate: string;
  registeredUser: string;
  caseName: string;
  assignee: string;
  status: string;
  updateDate: string;
  driveFolderUrl: string;
  incidentDetailUrl: string;
}

/**
 * スクリプトプロパティを取得する共通関数
 */
function getScriptProperty(propertyName: string, errorMessage: string): string {
  const scriptProperties = PropertiesService.getScriptProperties();
  const value = scriptProperties.getProperty(propertyName);

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

/**
 * ファイルをGoogle Driveにアップロード
 */
function uploadFileToDrive(fileData: FileData, folderId: string): string {
  const folder = DriveApp.getFolderById(folderId);
  const decodedData = Utilities.base64Decode(fileData.data);
  const blob = Utilities.newBlob(decodedData, fileData.mimeType, fileData.name);
  const file = folder.createFile(blob);

  return file.getUrl();
}

const INCIDENT_SHEET_NAME = "インシデント管理";

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
      "登録日時",
      "登録ユーザー",
      "案件名",
      "担当者",
      "ステータス",
      "更新日時",
      "Drive格納先フォルダ",
      "インシデント詳細",
    ]);
  }

  return sheet;
}

/**
 * インシデント一覧を取得
 */
function getIncidentList(): IncidentRecord[] {
  try {
    const spreadsheetId = getScriptProperty(
      "SPREADSHEET_ID",
      "スプレッドシートIDが設定されていません。"
    );
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const incidentSheet = ss.getSheetByName(INCIDENT_SHEET_NAME);

    if (!incidentSheet) {
      return [];
    }

    const lastRow = incidentSheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }

    const dataRange = incidentSheet.getRange(2, 1, lastRow - 1, 8);
    const values = dataRange.getValues();

    const records: IncidentRecord[] = [];

    for (let i = values.length - 1; i >= 0; i--) {
      const row = values[i];

      records.push({
        registeredDate: row[0] ? new Date(row[0]).toLocaleString("ja-JP") : "",
        registeredUser: row[1] || "",
        caseName: row[2] || "",
        assignee: row[3] || "",
        status: row[4] || "",
        updateDate: row[5] ? new Date(row[5]).toLocaleString("ja-JP") : "",
        driveFolderUrl: row[6] || "",
        incidentDetailUrl: row[7] || "",
      });
    }

    return records;
  } catch (error) {
    console.error("getIncidentList error:", error);
    throw new Error(`一覧取得エラー: ${(error as Error).message}`);
  }
}

/**
 * 登録日時から既存レコードの行番号を検索
 * @param sheet シート
 * @param registeredDate 登録日時（ロケール文字列）
 * @returns 行番号（見つからない場合は-1）
 */
function findIncidentRowByDate(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  registeredDate: string
): number {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return -1;
  }

  // 日付列（A列）を取得
  const dateRange = sheet.getRange(2, 1, lastRow - 1, 1);
  const dateValues = dateRange.getValues();

  for (let i = 0; i < dateValues.length; i++) {
    if (dateValues[i][0]) {
      const cellDate = new Date(dateValues[i][0]).toLocaleString("ja-JP");
      if (cellDate === registeredDate) {
        return i + 2; // シートの行番号（ヘッダー行を考慮して+2）
      }
    }
  }

  return -1;
}

/**
 * インシデント情報をスプレッドシートに保存
 */
function submitIncident(incidentData: IncidentData): IncidentResult {
  try {
    const spreadsheetId = getScriptProperty(
      "SPREADSHEET_ID",
      "スプレッドシートIDが設定されていません。"
    );
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const userEmail = Session.getEffectiveUser().getEmail();
    const incidentSheet = getOrCreateIncidentSheet(ss);

    // 編集モードかどうかをチェック
    const isEditMode = !!(
      incidentData.registeredDate && incidentData.registeredDate.trim()
    );
    let targetRow = -1;
    let incidentDate: Date;
    let originalUserEmail = userEmail;

    let driveFolderUrl = "";
    let incidentDetailUrl = "";

    const updateDate = new Date();

    if (isEditMode) {
      // 既存レコードを検索
      targetRow = findIncidentRowByDate(
        incidentSheet,
        incidentData.registeredDate!
      );
      if (targetRow === -1) {
        throw new Error("編集対象のレコードが見つかりませんでした。");
      }
      // 既存の登録日時とユーザー、URLを保持
      const existingData = incidentSheet
        .getRange(targetRow, 1, 1, 8)
        .getValues()[0];
      incidentDate = new Date(existingData[0]);
      originalUserEmail = existingData[1] as string;
      driveFolderUrl = existingData[6] as string;
      incidentDetailUrl = existingData[7] as string;

      // TODO: 詳細スプレッドシートの更新処理を実装
    } else {
      // 新規作成
      incidentDate = new Date();

      // 1. インシデント用フォルダを作成
      const parentFolderId = getScriptProperty(
        "UPLOAD_FOLDER_ID",
        "アップロード先のフォルダIDが設定されていません。"
      );
      const parentFolder = DriveApp.getFolderById(parentFolderId);
      const folderName = `${
        incidentData.caseName
      }_${incidentDate.getFullYear()}${(incidentDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${incidentDate
        .getDate()
        .toString()
        .padStart(2, "0")}`;
      const newFolder = parentFolder.createFolder(folderName);
      driveFolderUrl = newFolder.getUrl();

      // 2. フォルダの権限を設定
      newFolder.addEditor(userEmail);

      // 3. テンプレートスプレッドシートをコピー
      const templateSheetId = getScriptProperty(
        "TEMPLATE_SHEET_ID",
        "テンプレートスプレッドシートIDが設定されていません。"
      );
      const templateFile = DriveApp.getFileById(templateSheetId);
      const newSheet = templateFile.makeCopy(
        `${incidentData.caseName}_詳細`,
        newFolder
      );
      incidentDetailUrl = newSheet.getUrl();

      // 4. コピーしたスプレッドシートに詳細情報を書き込む
      const detailSheet = SpreadsheetApp.openById(newSheet.getId());
      const sheet = detailSheet.getSheetByName("詳細"); // シート名はテンプレートに合わせてください
      if (sheet) {
        sheet.getRange("B1").setValue(incidentData.summary);
        sheet.getRange("B2").setValue(incidentData.stakeholders);
        sheet.getRange("B3").setValue(incidentData.details);

        // 添付ファイルのアップロードと書き込み
        if (incidentData.fileDataList && incidentData.fileDataList.length > 0) {
          const folderId = newFolder.getId();
          const cell = sheet.getRange("B4");
          const richTextBuilder = SpreadsheetApp.newRichTextValue();
          let text = "";

          incidentData.fileDataList.forEach((fileData, index) => {
            const fileUrl = uploadFileToDrive(fileData, folderId);
            const fileName = fileData.name;
            if (index > 0) {
              text += "\n";
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

      // 5. メインシートに新規行を追加
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

    // 更新処理（isEditModeの場合）
    if (isEditMode) {
      // メインシートの更新
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

      // 詳細スプレッドシートの更新
      if (incidentDetailUrl) {
        const detailSheetId = extractSheetIdFromUrl(incidentDetailUrl);
        const detailSheet = SpreadsheetApp.openById(detailSheetId);
        const sheet = detailSheet.getSheetByName("詳細"); // シート名はテンプレートに合わせてください
        if (sheet) {
          sheet.getRange("B1").setValue(incidentData.summary);
          sheet.getRange("B2").setValue(incidentData.stakeholders);
          sheet.getRange("B3").setValue(incidentData.details);

          // 添付ファイルのアップロードと書き込み（上書き）
          if (
            incidentData.fileDataList &&
            incidentData.fileDataList.length > 0
          ) {
            const folderId = extractFolderIdFromUrl(driveFolderUrl);
            const cell = sheet.getRange("B4");
            const richTextBuilder = SpreadsheetApp.newRichTextValue();
            let text = "";

            incidentData.fileDataList.forEach((fileData, index) => {
              const fileUrl = uploadFileToDrive(fileData, folderId);
              const fileName = fileData.name;
              if (index > 0) {
                text += "\n";
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

    const record: IncidentRecord = {
      registeredDate: incidentDate.toLocaleString("ja-JP"),
      registeredUser: originalUserEmail,
      caseName: incidentData.caseName,
      assignee: incidentData.assignee,
      status: incidentData.status,
      updateDate: updateDate.toLocaleString("ja-JP"),
      driveFolderUrl: driveFolderUrl,
      incidentDetailUrl: incidentDetailUrl,
    };

    return {
      success: true,
      message: "インシデント情報を登録しました",
      incidentDate: incidentDate.toISOString(),
      record: record,
    };
  } catch (error) {
    console.error("submitIncident error:", error);
    throw new Error(`登録処理エラー: ${(error as Error).message}`);
  }
}

/**
 * GoogleスプレッドシートのURLからIDを抽出
 */
function extractSheetIdFromUrl(url: string): string {
  const match = url.match(/\/d\/(.+?)\//);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("URLからスプレッドシートIDを抽出できませんでした。");
}

/**
 * Google DriveのフォルダURLからIDを抽出
 */
function extractFolderIdFromUrl(url: string): string {
  const match = url.match(/folders\/(.+)/);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("URLからフォルダIDを抽出できませんでした。");
}

/**
 * WebアプリのGETリクエスト処理
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile("index").setTitle(
    "【セルプロ】インシデント管理"
  );
}
