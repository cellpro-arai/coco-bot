// スプレッドシートID（環境に合わせて変更してください）
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const SHEET_NAME = 'データ';

function doGet(e) {
  // HTMLページを表示
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('スプレッドシート一覧')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents || "{}");
  return ContentService
    .createTextOutput(JSON.stringify({ received: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * スプレッドシートからデータを取得
 */
function getSpreadsheetData() {
  try {
    let spreadsheet;

    // スプレッドシートIDが設定されている場合はそれを使用、なければ新規作成
    if (SPREADSHEET_ID) {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    } else {
      // 新規スプレッドシートを作成
      spreadsheet = SpreadsheetApp.create('データ管理');
      const newId = spreadsheet.getId();

      // スクリプトプロパティに保存
      PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', newId);

      // 初期データを設定
      initializeSpreadsheet(spreadsheet);
    }

    // 指定されたシートを取得
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // シートが存在しない場合は作成
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      initializeSheet(sheet);
    }

    // データを取得
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      // データがない場合はサンプルデータを作成
      initializeSheet(sheet);
      return sheet.getDataRange().getValues();
    }

    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    return data;

  } catch (error) {
    throw new Error('データの取得に失敗しました: ' + error.message);
  }
}

/**
 * スプレッドシートを初期化（サンプルデータを追加）
 */
function initializeSpreadsheet(spreadsheet) {
  const sheet = spreadsheet.getSheets()[0];
  sheet.setName(SHEET_NAME);
  initializeSheet(sheet);
}

/**
 * シートにサンプルデータを追加
 */
function initializeSheet(sheet) {
  // ヘッダー行
  const headers = ['タイトル', 'カテゴリ', 'ステータス', '担当者', '更新日'];

  // サンプルデータ
  const sampleData = [
    headers,
    ['プロジェクトA', '開発', '進行中', '山田太郎', new Date().toLocaleDateString('ja-JP')],
    ['プロジェクトB', 'デザイン', '完了', '佐藤花子', new Date().toLocaleDateString('ja-JP')],
    ['プロジェクトC', 'マーケティング', '準備中', '鈴木一郎', new Date().toLocaleDateString('ja-JP')],
    ['プロジェクトD', '開発', '進行中', '田中次郎', new Date().toLocaleDateString('ja-JP')],
    ['プロジェクトE', '営業', 'レビュー中', '高橋三郎', new Date().toLocaleDateString('ja-JP')]
  ];

  // データを書き込み
  sheet.getRange(1, 1, sampleData.length, sampleData[0].length).setValues(sampleData);

  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#667eea')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // 列幅を自動調整
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  // 行の固定
  sheet.setFrozenRows(1);
}

/**
 * スプレッドシートのURLを取得
 */
function getSpreadsheetUrl() {
  try {
    if (SPREADSHEET_ID) {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      return spreadsheet.getUrl();
    }
    return null;
  } catch (error) {
    return null;
  }
}