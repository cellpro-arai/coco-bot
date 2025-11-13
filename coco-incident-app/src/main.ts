/**
 * ========================================
 * インシデント管理フォーム - Alpine.js版
 * ========================================
 *
 * 【セットアップ手順】
 * 1. Google Apps Scriptで新規プロジェクトを作成
 * 2. このmain.tsとindex.htmlをプロジェクトに追加
 * 3. setSpreadsheetId()関数でスプレッドシートIDを設定
 * 4. Webアプリとしてデプロイ（アクセス: 全員）
 *
 * 【必要なスプレッドシート構成】
 * - 「インシデント管理」シート: 自動作成されます
 *
 * 【主な機能】
 * - インシデント情報の記録
 * - ローディング・エラー表示
 * - フォームリセット機能
 * - 詳細情報入力の促進
 *
 * ========================================
 */

/**
 * インシデントデータの型定義
 */
interface IncidentData {
  caseName: string;
  assignee: string;
  summary: string;
  stakeholders: string;
  details: string;
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
 * WebアプリのGETリクエスト処理
 * index.htmlをテンプレートとして返す
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile("index").setTitle(
    "インシデント管理"
  );
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

    // インシデント管理シートを取得または作成
    let incidentSheet = ss.getSheetByName("インシデント管理");
    if (!incidentSheet) {
      incidentSheet = ss.insertSheet("インシデント管理");
      // ヘッダー行を追加
      incidentSheet.appendRow([
        "登録日時",
        "案件名",
        "担当者",
        "トラブル概要",
        "ステークホルダー",
        "トラブル詳細",
      ]);
    }

    // 登録日時
    const incidentDate = new Date();

    // インシデント情報を追加
    incidentSheet.appendRow([
      incidentDate,
      incidentData.caseName,
      incidentData.assignee,
      incidentData.summary,
      incidentData.stakeholders,
      incidentData.details,
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
