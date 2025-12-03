/**
 * インシデント一覧を取得
 */
function getIncidentList(): IncidentRecord[] {
  try {
    const spreadsheetId = getScriptProperty(
      'SPREADSHEET_ID',
      'スプレッドシートIDが設定されていません。'
    );
    const ss = SpreadsheetApp.openById(spreadsheetId);

    const userEmail = Session.getEffectiveUser().getEmail();
    const userIsAdmin = isAdmin(userEmail);

    const incidentSheet = ss.getSheetByName(INCIDENT_SHEET_NAME);
    if (!incidentSheet) {
      return [];
    }

    const lastRow = incidentSheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }

    let values = incidentSheet.getRange(2, 1, lastRow - 1, 8).getValues();

    // 管理者は全件表示、一般ユーザーは自分が登録したもののみ表示
    if (!userIsAdmin) {
      values = values.filter(row => row[1] === userEmail);
    }

    const records: IncidentRecord[] = [];

    for (let i = values.length - 1; i >= 0; i--) {
      const row = values[i];

      const record: IncidentRecord = {
        registeredDate: row[0] ? new Date(row[0]).toLocaleString('ja-JP') : '',
        registeredUser: row[1] || '',
        caseName: row[2] || '',
        assignee: row[3] || '',
        status: row[4] || '',
        updateDate: row[5] ? new Date(row[5]).toLocaleString('ja-JP') : '',
        driveFolderUrl: row[6] || '',
        incidentDetailUrl: row[7] || '',
      };

      if (record.incidentDetailUrl) {
        try {
          const detailSheetId = extractSheetIdFromUrl(record.incidentDetailUrl);
          const detailSpreadsheet = SpreadsheetApp.openById(detailSheetId);
          const allSheets = detailSpreadsheet.getSheets();

          // テンプレートの最初のシートを取得（「詳細」または「シート1」など）
          const detailSheet = allSheets.length > 0 ? allSheets[0] : null;

          if (detailSheet) {
            const detailValues = detailSheet.getRange('B1:B5').getValues();
            record.summary = detailValues[0][0];
            record.stakeholders = detailValues[1][0];
            record.details = detailValues[2][0];
            record.attachments = detailSheet
              .getRange('B4')
              .getRichTextValue()
              ?.getText();

            // B5セルのAI解析結果を取得
            const aiAnalysis = detailValues[4][0];
            if (aiAnalysis && typeof aiAnalysis === 'string') {
              // =AI(...) のような数式が入っている場合は未解析
              if (
                aiAnalysis.trim().startsWith('=AI(') ||
                aiAnalysis.trim().startsWith('=ai(')
              ) {
                record.aiAnalysisStatus = AI_ANALYSIS_STATUS.PENDING;
              } else if (aiAnalysis.trim().length > 0) {
                record.aiAnalysisStatus = AI_ANALYSIS_STATUS.COMPLETED;
                record.aiAnalysis = aiAnalysis;
              } else {
                record.aiAnalysisStatus = AI_ANALYSIS_STATUS.NONE;
              }
            } else {
              record.aiAnalysisStatus = AI_ANALYSIS_STATUS.NONE;
            }
          }
        } catch (e) {
          console.error(
            `詳細シートの読み込みに失敗しました: ${record.incidentDetailUrl}`,
            e
          );
          // 詳細が取得できなくてもエラーにはせず、取得できた情報だけで続行
        }
      }
      records.push(record);
    }

    return records;
  } catch (error) {
    console.error('getIncidentList error:', error);
    throw new Error(`一覧取得エラー: ${(error as Error).message}`);
  }
}
