/**
 * ========================================
 * インシデント管理フォーム - Alpine.js版
 * ========================================
 *
 * 【セットアップ手順】
 * 1. Google Apps Scriptで新規プロジェクトを作成
 * 2. このmain.tsとindex.htmlをプロジェクトに追加
 * 3. setSpreadsheetId()関数でスプレッドシートIDを設定
 * 4. setUploadFolderId()関数でGoogle DriveのフォルダIDを設定
 * 5. Webアプリとしてデプロイ（アクセス: 全員）
 *
 * 【必要なスプレッドシート構成】
 * - 「インシデント管理」シート: 自動作成されます
 *
 * 【主な機能】
 * - インシデント情報の記録
 * - ファイルアップロード
 * - ローディング・エラー表示
 * - フォームリセット機能
 * - 詳細情報入力の促進
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
  caseName: string;
  assignee: string;
  summary: string;
  stakeholders: string;
  details: string;
  fileData: FileData | null;
}

/**
 * インシデント登録結果の型定義
 */
interface IncidentResult {
  success: boolean;
  message: string;
  incidentDate: string;
}

/**
 * スプレッドシートIDを設定する関数（初回のみ実行）
 * Apps Scriptエディタから手動で実行してください
 */
function setSpreadsheetId(): void {
  const spreadsheetId = "YOUR_SPREADSHEET_ID_HERE"; // ここに実際のスプレッドシートIDを入力
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty("SPREADSHEET_ID", spreadsheetId);
  Logger.log("スプレッドシートIDを設定しました: " + spreadsheetId);
}

/**
 * アップロード先Google DriveフォルダIDを設定する関数（初回のみ実行）
 * Apps Scriptエディタから手動で実行してください
 */
function setUploadFolderId(): void {
  const folderId = "YOUR_FOLDER_ID_HERE"; // ここに実際のスプレッドシートIDを入力
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty("UPLOAD_FOLDER_ID", folderId);
  Logger.log("アップロード先フォルダIDを設定しました: " + folderId);
}

/**
 * WebアプリのGETリクエスト処理
 * index.htmlをテンプレートとして返す
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile("index").setTitle(
    "インシデント管理"
  );
}

/**
 * ファイルをGoogle Driveにアップロード
 * @param fileData - ファイルデータ
 * @return ファイルURL
 */
function uploadFileToDrive(fileData: FileData): string {
  const scriptProperties = PropertiesService.getScriptProperties();
  const folderId = scriptProperties.getProperty("UPLOAD_FOLDER_ID");

  if (!folderId) {
    throw new Error("アップロード先のフォルダIDが設定されていません。");
  }

  const folder = DriveApp.getFolderById(folderId);
  const decodedData = Utilities.base64Decode(fileData.data);
  const blob = Utilities.newBlob(decodedData, fileData.mimeType, fileData.name);
  const file = folder.createFile(blob);

  return file.getUrl();
}

/**
 * インシデント情報をスプレッドシートに保存
 * @param incidentData - インシデントデータ
 * @return 処理結果
 */
function submitIncident(incidentData: IncidentData): IncidentResult {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const spreadsheetId = scriptProperties.getProperty("SPREADSHEET_ID");

    if (!spreadsheetId) {
      throw new Error("スプレッドシートIDが設定されていません。");
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);

    // ログイン中のユーザーのメールアドレスを取得
    const userEmail = Session.getEffectiveUser().getEmail();

    // インシデント管理シートを取得または作成
    let incidentSheet = ss.getSheetByName("インシデント管理");
    if (!incidentSheet) {
      incidentSheet = ss.insertSheet("インシデント管理");
      // ヘッダー行を追加
      incidentSheet.appendRow([
        "登録日時",
        "登録ユーザー",
        "案件名",
        "担当者",
        "トラブル概要",
        "ステークホルダー",
        "トラブル詳細",
        "添付ファイル",
      ]);
    }

    // ファイルアップロード処理
    let fileUrl = "";
    if (incidentData.fileData) {
      fileUrl = uploadFileToDrive(incidentData.fileData);
    }

    // 登録日時
    const incidentDate = new Date();

    // インシデント情報を追加
    incidentSheet.appendRow([
      incidentDate,
      userEmail,
      incidentData.caseName,
      incidentData.assignee,
      incidentData.summary,
      incidentData.stakeholders,
      incidentData.details,
      fileUrl,
    ]);

    return {
      success: true,
      message: "インシデント情報を登録しました",
      incidentDate: incidentDate.toISOString(),
    };
  } catch (error) {
    console.error("submitIncident error:", error);
    throw new Error(`登録処理エラー: ${(error as Error).message}`);
  }
}
