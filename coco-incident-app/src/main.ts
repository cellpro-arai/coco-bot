/**
 * ========================================
 * 発注フォーム - Alpine.js版
 * ========================================
 *
 * 【セットアップ手順】
 * 1. Google Apps Scriptで新規プロジェクトを作成
 * 2. このmain.tsとindex.htmlをプロジェクトに追加
 * 3. setSpreadsheetId()関数でスプレッドシートIDを設定
 * 4. Webアプリとしてデプロイ（アクセス: 全員）
 *
 * 【必要なスプレッドシート構成】
 * - 「商品」シート: 商品ID | 商品名 | 単価 | 在庫数
 * - 「発注履歴」シート: 自動作成されます
 *
 * 【主な機能】
 * - リアルタイム合計金額計算
 * - ローディング・エラー表示
 * - フォームリセット機能
 * - 在庫数に応じた個数選択
 *
 * ========================================
 */

/**
 * 商品データの型定義
 */
interface ProductRecord {
  商品ID: string;
  商品名: string;
  単価: number;
  在庫数: number;
}

/**
 * 発注データの型定義
 */
interface OrderData {
  email: string;
  username: string;
  items: { [key: string]: number };
  totalAmount: number;
}

/**
 * 発注結果の型定義
 */
interface OrderResult {
  success: boolean;
  message: string;
  orderDate: string;
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
  return HtmlService.createHtmlOutputFromFile("index").setTitle("発注フォーム");
}

/**
 * スプレッドシートから全レコードを取得
 * @param sheetName - シート名
 * @return レコードの配列
 */
function getAllRecords(sheetName: string): ProductRecord[] {
  try {
    // Get spreadsheet ID from script properties
    const scriptProperties = PropertiesService.getScriptProperties();
    const spreadsheetId = scriptProperties.getProperty("SPREADSHEET_ID");

    if (!spreadsheetId) {
      throw new Error(
        "スプレッドシートIDが設定されていません。setSpreadsheetId()を実行してください。"
      );
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`シート「${sheetName}」が見つかりません。`);
    }

    const values = sheet.getDataRange().getValues();
    const labels = values.shift() as string[];

    const records: ProductRecord[] = [];
    for (const value of values) {
      const record: any = {};
      labels.forEach((label, index) => {
        record[label] = value[index];
      });
      records.push(record as ProductRecord);
    }

    return records;
  } catch (error) {
    console.error("getAllRecords error:", error);
    throw new Error(`データ取得エラー: ${(error as Error).message}`);
  }
}

/**
 * 発注データをスプレッドシートに保存
 * @param orderData - 発注データ
 * @return 処理結果
 */
function submitOrder(orderData: OrderData): OrderResult {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const spreadsheetId = scriptProperties.getProperty("SPREADSHEET_ID");

    if (!spreadsheetId) {
      throw new Error("スプレッドシートIDが設定されていません。");
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);

    // 発注履歴シートを取得または作成
    let orderSheet = ss.getSheetByName("発注履歴");
    if (!orderSheet) {
      orderSheet = ss.insertSheet("発注履歴");
      // ヘッダー行を追加
      orderSheet.appendRow([
        "発注日時",
        "Email",
        "お名前",
        "商品ID",
        "商品名",
        "個数",
        "単価",
        "小計",
        "合計金額",
      ]);
    }

    // 商品情報を取得
    const items = getAllRecords("商品");
    const itemMap: { [key: string]: ProductRecord } = {};
    items.forEach((item) => {
      itemMap[item["商品ID"]] = item;
    });

    // 発注日時
    const orderDate = new Date();

    // 発注された商品ごとに行を追加
    let firstRow = true;
    for (const [itemId, quantity] of Object.entries(orderData.items)) {
      if (quantity > 0) {
        const item = itemMap[itemId];
        if (item) {
          const subtotal = quantity * item["単価"];
          orderSheet.appendRow([
            orderDate,
            orderData.email,
            orderData.username,
            itemId,
            item["商品名"],
            quantity,
            item["単価"],
            subtotal,
            firstRow ? orderData.totalAmount : "", // 合計は最初の行のみ
          ]);
          firstRow = false;
        }
      }
    }

    // 在庫を更新（オプション: 必要に応じて実装）
    // updateInventory(orderData.items);

    return {
      success: true,
      message: "発注が完了しました",
      orderDate: orderDate.toISOString(),
    };
  } catch (error) {
    console.error("submitOrder error:", error);
    throw new Error(`発注処理エラー: ${(error as Error).message}`);
  }
}

/**
 * 在庫を更新する（オプション機能）
 * @param items - 商品IDと個数のオブジェクト
 */
function updateInventory(items: { [key: string]: number }): {
  success: boolean;
} {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const spreadsheetId = scriptProperties.getProperty("SPREADSHEET_ID");

    if (!spreadsheetId) {
      throw new Error("スプレッドシートIDが設定されていません。");
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName("商品");

    if (!sheet) {
      throw new Error("商品シートが見つかりません");
    }

    const values = sheet.getDataRange().getValues();
    const headers = values[0] as string[];
    const idIndex = headers.indexOf("商品ID");
    const stockIndex = headers.indexOf("在庫数");

    if (idIndex === -1 || stockIndex === -1) {
      throw new Error("商品IDまたは在庫数の列が見つかりません");
    }

    // 商品IDごとに在庫を減らす
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const itemId = row[idIndex] as string;
      const currentStock = row[stockIndex] as number;

      if (items[itemId] && items[itemId] > 0) {
        const newStock = currentStock - items[itemId];
        if (newStock < 0) {
          throw new Error(
            `${row[headers.indexOf("商品名")]}の在庫が不足しています`
          );
        }
        sheet.getRange(i + 1, stockIndex + 1).setValue(newStock);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("updateInventory error:", error);
    throw error;
  }
}
