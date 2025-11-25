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
 * WebアプリのGETリクエスト処理
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile("index").setTitle(
    "【セルプロ】インシデント管理"
  );
}
