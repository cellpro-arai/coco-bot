/**
 * ========================================
 * 経費精算フォーム
 * ========================================
 *
 * 【セットアップ手順】
 * 1. Google Apps Scriptで新規プロジェクトを作成
 * 2. このmain.tsとindex.htmlをプロジェクトに追加
 * 3. setSpreadsheetId()関数でスプレッドシートIDを設定
 * 4. setUploadFolderId()関数でGoogle DriveのフォルダIDを設定
 * 5. Webアプリとしてデプロイ（アクセス: 組織 *開発時は自分のみ）
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
 * 経費精算データの型定義
 */
interface ExpenseData {
  name: string;
  workScheduleFile: FileData | null;
  expenseFile: FileData | null;
  workStartTime: string;
  workEndTime: string;
  hasCommuterPass: string;
  nearestStation: string;
  workStation: string;
  monthlyFee: string;
  remarks: string;
}

/**
 * 経費精算登録結果の型定義
 */
interface ExpenseResult {
  success: boolean;
  message: string;
  submittedDate: string;
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
function uploadFileToDrive(fileData: FileData): string {
  const folderId = getScriptProperty(
    "UPLOAD_FOLDER_ID",
    "アップロード先のフォルダIDが設定されていません。"
  );
  const folder = DriveApp.getFolderById(folderId);
  const decodedData = Utilities.base64Decode(fileData.data);
  const blob = Utilities.newBlob(decodedData, fileData.mimeType, fileData.name);
  const file = folder.createFile(blob);

  return file.getUrl();
}

const EXPENSE_SHEET_NAME = "経費精算";

/**
 * 経費精算シートを取得または作成
 */
function getOrCreateExpenseSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = spreadsheet.getSheetByName(EXPENSE_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(EXPENSE_SHEET_NAME);
    sheet.appendRow([
      "提出日時",
      "提出者",
      "氏名",
      "勤務表",
      "交通費・経費",
      "開始時間",
      "終了時間",
      "定期券購入",
      "最寄り駅",
      "勤務先の駅",
      "月額",
      "備考",
    ]);
  }

  return sheet;
}

/**
 * 経費精算情報をスプレッドシートに保存
 */
function submitExpense(expenseData: ExpenseData): ExpenseResult {
  try {
    const spreadsheetId = getScriptProperty(
      "SPREADSHEET_ID",
      "スプレッドシートIDが設定されていません。"
    );
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const userEmail = Session.getEffectiveUser().getEmail();
    const expenseSheet = getOrCreateExpenseSheet(ss);

    const submittedDate = new Date();

    // ファイルアップロード処理
    let workScheduleUrl = "";
    let expenseFileUrl = "";

    if (expenseData.workScheduleFile) {
      workScheduleUrl = uploadFileToDrive(expenseData.workScheduleFile);
    }

    if (expenseData.expenseFile) {
      expenseFileUrl = uploadFileToDrive(expenseData.expenseFile);
    }

    // 新規行を追加
    expenseSheet.appendRow([
      submittedDate,
      userEmail,
      expenseData.name,
      workScheduleUrl,
      expenseFileUrl,
      expenseData.workStartTime,
      expenseData.workEndTime,
      expenseData.hasCommuterPass === "yes" ? "有り" : "無し",
      expenseData.nearestStation,
      expenseData.workStation,
      expenseData.monthlyFee,
      expenseData.remarks,
    ]);

    // ファイル列にハイパーリンクを設定
    const lastRow = expenseSheet.getLastRow();

    if (workScheduleUrl) {
      const workScheduleCell = expenseSheet.getRange(lastRow, 4);
      const richTextBuilder = SpreadsheetApp.newRichTextValue()
        .setText(expenseData.workScheduleFile!.name)
        .setLinkUrl(workScheduleUrl);
      workScheduleCell.setRichTextValue(richTextBuilder.build());
    }

    if (expenseFileUrl) {
      const expenseFileCell = expenseSheet.getRange(lastRow, 5);
      const richTextBuilder = SpreadsheetApp.newRichTextValue()
        .setText(expenseData.expenseFile!.name)
        .setLinkUrl(expenseFileUrl);
      expenseFileCell.setRichTextValue(richTextBuilder.build());
    }

    return {
      success: true,
      message: "経費精算フォームを提出しました",
      submittedDate: submittedDate.toISOString(),
    };
  } catch (error) {
    console.error("submitExpense error:", error);
    throw new Error(`登録処理エラー: ${(error as Error).message}`);
  }
}

/**
 * WebアプリのGETリクエスト処理
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile("index").setTitle(
    "【セルプロ】経費精算フォーム"
  );
}
