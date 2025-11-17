/**
 * ========================================
 * インシデント管理フォーム
 * ========================================
 *
 * 【セットアップ手順】
 * 1. Google Apps Scriptで新規プロジェクトを作成
 * 2. このmain.tsとindex.htmlをプロジェクトに追加
 * 3. setSpreadsheetId()関数でスプレッドシートIDを設定
 * 4. setUploadFolderId()関数でGoogle DriveのフォルダIDを設定
 * 5. setOpenAiApiKey()関数でOpenAI APIキーを設定（オプション）
 * 6. Webアプリとしてデプロイ（アクセス: 組織 *開発時は自分のみ）
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
  improvementSuggestions?: string;
}

/**
 * インシデント一覧取得用の型定義
 */
interface IncidentRecord {
  registeredDate: string;
  registeredUser: string;
  caseName: string;
  assignee: string;
  summary: string;
  stakeholders: string;
  details: string;
  attachments: string;
  status: string;
  updateDate: string;
  aiSuggestions: string;
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

/**
 * OpenAI APIを呼び出してインシデント改善案を取得
 */
function getIncidentImprovement(
  apiKey: string,
  incidentData: IncidentData
): string {
  try {
    const endpoint = "https://api.openai.com/v1/chat/completions";

    // プロンプトの作成
    const prompt = `
あなたはインシデント管理の専門家です。以下のインシデント報告を分析し、改善案を提案してください。

【案件名】
${incidentData.caseName}

【担当者】
${incidentData.assignee}

【トラブル概要】
${incidentData.summary}

【ステークホルダー】
${incidentData.stakeholders}

【トラブル詳細】
${incidentData.details}

以下の観点から具体的な改善案を提案してください：
1. 報告内容の完全性（不足している情報や追加すべき情報）
2. 対応プロセスの改善点
3. 再発防止策
4. コミュニケーション改善策
5. その他の気づき

改善案は簡潔で実行可能な形式で提案してください。
    `.trim();

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたはインシデント管理の専門家です。提出されたインシデント報告を分析し、建設的で具体的な改善案を提案します。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(endpoint, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log(`OpenAI API Error: ${response.getContentText()}`);
      throw new Error(`OpenAI API returned status code ${responseCode}`);
    }

    const jsonResponse = JSON.parse(response.getContentText());

    if (
      !jsonResponse.choices ||
      jsonResponse.choices.length === 0 ||
      !jsonResponse.choices[0].message
    ) {
      throw new Error("OpenAI APIからの応答が不正です");
    }

    return jsonResponse.choices[0].message.content.trim();
  } catch (error) {
    console.error("getIncidentImprovement error:", error);
    return `改善案の生成中にエラーが発生しました: ${(error as Error).message}`;
  }
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
      "トラブル概要",
      "ステークホルダー",
      "トラブル詳細",
      "添付ファイル",
      "ステータス",
      "更新日時",
      "AI改善案",
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

    const dataRange = incidentSheet.getRange(2, 1, lastRow - 1, 11);
    const values = dataRange.getValues();
    const richTextValues = dataRange.getRichTextValues();

    const records: IncidentRecord[] = [];

    for (let i = values.length - 1; i >= 0; i--) {
      const row = values[i];
      const richTextRow = richTextValues[i];

      let attachments = "";
      const attachmentCell = richTextRow[7];
      if (attachmentCell && attachmentCell.getText()) {
        attachments = attachmentCell.getText();
      }

      records.push({
        registeredDate: row[0] ? new Date(row[0]).toLocaleString("ja-JP") : "",
        registeredUser: row[1] || "",
        caseName: row[2] || "",
        assignee: row[3] || "",
        summary: row[4] || "",
        stakeholders: row[5] || "",
        details: row[6] || "",
        attachments: attachments,
        status: row[8] || "",
        updateDate: row[9] ? new Date(row[9]).toLocaleString("ja-JP") : "",
        aiSuggestions: row[10] || "",
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
    const isEditMode = !!(incidentData.registeredDate && incidentData.registeredDate.trim());
    let targetRow = -1;
    let incidentDate: Date;
    let originalUserEmail = userEmail;

    if (isEditMode) {
      // 既存レコードを検索
      targetRow = findIncidentRowByDate(incidentSheet, incidentData.registeredDate!);
      if (targetRow === -1) {
        throw new Error("編集対象のレコードが見つかりませんでした。");
      }
      // 既存の登録日時とユーザーを保持
      const existingData = incidentSheet.getRange(targetRow, 1, 1, 2).getValues()[0];
      incidentDate = new Date(existingData[0]);
      originalUserEmail = existingData[1] as string;
    } else {
      // 新規作成
      incidentDate = new Date();
      targetRow = incidentSheet.getLastRow() + 1;
    }

    // ファイルアップロード処理
    const fileUrls: string[] = [];
    const fileNames: string[] = [];
    if (incidentData.fileDataList && incidentData.fileDataList.length > 0) {
      for (const fileData of incidentData.fileDataList) {
        const url = uploadFileToDrive(fileData);
        fileUrls.push(url);
        fileNames.push(fileData.name);
      }
    }

    // 更新日時（編集時のみ設定）
    const updateDate = isEditMode ? new Date() : incidentDate;

    // レコードを保存（新規作成または更新）
    if (isEditMode) {
      // 既存行を更新（日付とユーザーは保持、他のデータを更新）
      incidentSheet.getRange(targetRow, 1, 1, 10).setValues([[
        incidentDate,
        originalUserEmail,
        incidentData.caseName,
        incidentData.assignee,
        incidentData.summary,
        incidentData.stakeholders,
        incidentData.details,
        "", // 添付ファイル（後で設定）
        incidentData.status,
        updateDate,
      ]]);
    } else {
      // 新規行を追加
      incidentSheet.appendRow([
        incidentDate,
        userEmail,
        incidentData.caseName,
        incidentData.assignee,
        incidentData.summary,
        incidentData.stakeholders,
        incidentData.details,
        "", // 添付ファイル（後で設定）
        incidentData.status,
        updateDate,
        "", // AI改善案（後で設定）
      ]);
    }

    let attachments = "";
    if (fileUrls.length > 0) {
      const fileCell = incidentSheet.getRange(targetRow, 8);
      let text = "";
      const linkRanges: Array<{ start: number; end: number; url: string }> = [];

      for (let i = 0; i < fileNames.length; i++) {
        if (i > 0) text += "\n";
        const startOffset = text.length;
        text += fileNames[i];
        const endOffset = text.length;
        linkRanges.push({
          start: startOffset,
          end: endOffset,
          url: fileUrls[i],
        });
      }

      const richTextBuilder = SpreadsheetApp.newRichTextValue().setText(text);
      for (const range of linkRanges) {
        richTextBuilder.setLinkUrl(range.start, range.end, range.url);
      }

      fileCell.setRichTextValue(richTextBuilder.build());
      attachments = text;
    }

    // OpenAI APIキーが設定されている場合のみ改善案を取得
    let improvementSuggestions: string = "";
    const scriptProperties = PropertiesService.getScriptProperties();
    const apiKey = scriptProperties.getProperty("OPENAI_API_KEY");

    if (apiKey) {
      try {
        improvementSuggestions = getIncidentImprovement(apiKey, incidentData);
      } catch (aiError) {
        console.error("AI improvement error:", aiError);
        improvementSuggestions = `改善案の取得に失敗しました: ${
          (aiError as Error).message
        }`;
      }
    } else {
      console.log(
        "OpenAI APIキーが設定されていないため、AI改善案の取得をスキップします"
      );
    }

    // AI改善案をスプレッドシートに保存
    if (improvementSuggestions) {
      incidentSheet.getRange(targetRow, 11).setValue(improvementSuggestions);
    }

    const record: IncidentRecord = {
      registeredDate: incidentDate.toLocaleString("ja-JP"),
      registeredUser: originalUserEmail,
      caseName: incidentData.caseName,
      assignee: incidentData.assignee,
      summary: incidentData.summary,
      stakeholders: incidentData.stakeholders,
      details: incidentData.details,
      attachments: attachments,
      status: incidentData.status,
      updateDate: updateDate.toLocaleString("ja-JP"),
      aiSuggestions: improvementSuggestions,
    };

    return {
      success: true,
      message: "インシデント情報を登録しました",
      incidentDate: incidentDate.toISOString(),
      record: record,
      improvementSuggestions: improvementSuggestions,
    };
  } catch (error) {
    console.error("submitIncident error:", error);
    throw new Error(`登録処理エラー: ${(error as Error).message}`);
  }
}

/**
 * WebアプリのGETリクエスト処理
 */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile("index").setTitle(
    "【セルプロ】インシデント管理"
  );
}
