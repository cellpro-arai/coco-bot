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

    // --- Permission Check Start ---
    const userEmail = Session.getEffectiveUser().getEmail();
    const userRole = getUserRole(ss, userEmail);

    if (!userRole) {
      console.warn(`権限がありません: ${userEmail}`);
      return [];
    }
    // --- Permission Check End ---

    const incidentSheet = ss.getSheetByName(INCIDENT_SHEET_NAME);
    if (!incidentSheet) {
      return [];
    }

    const lastRow = incidentSheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }

    let values = incidentSheet.getRange(2, 1, lastRow - 1, 8).getValues();

    // --- Filtering based on Role ---
    if (userRole === 'user') {
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
          const detailSheet = detailSpreadsheet.getSheetByName('詳細');
          if (detailSheet) {
            const detailValues = detailSheet.getRange('B1:B4').getValues();
            record.summary = detailValues[0][0];
            record.stakeholders = detailValues[1][0];
            record.details = detailValues[2][0];
            record.attachments = detailSheet
              .getRange('B4')
              .getRichTextValue()
              ?.getText();
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

/**
 * インシデント情報をスプレッドシートに保存
 */
function submitIncident(incidentData: IncidentData): IncidentResult {
  try {
    const spreadsheetId = getScriptProperty(
      'SPREADSHEET_ID',
      'スプレッドシートIDが設定されていません。'
    );
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const userEmail = Session.getEffectiveUser().getEmail();

    // --- Permission Check Start ---
    const userRole = getUserRole(ss, userEmail);
    if (!userRole) {
      throw new Error('権限がありません。管理者に問い合わせてください。');
    }
    // --- Permission Check End ---

    const incidentSheet = getOrCreateIncidentSheet(ss);

    const isEditMode = !!(
      incidentData.registeredDate && incidentData.registeredDate.trim()
    );
    let targetRow = -1;
    let incidentDate: Date;
    let originalUserEmail = userEmail;

    let driveFolderUrl = '';
    let incidentDetailUrl = '';

    const updateDate = new Date();

    if (isEditMode) {
      targetRow = findIncidentRowByDate(
        incidentSheet,
        incidentData.registeredDate!
      );
      if (targetRow === -1) {
        throw new Error('編集対象のレコードが見つかりませんでした。');
      }
      const existingData = incidentSheet
        .getRange(targetRow, 1, 1, 8)
        .getValues()[0];
      incidentDate = new Date(existingData[0]);
      originalUserEmail = existingData[1] as string;
      driveFolderUrl = existingData[6] as string;
      incidentDetailUrl = existingData[7] as string;
    } else {
      incidentDate = new Date();

      const parentFolderId = getScriptProperty(
        'UPLOAD_FOLDER_ID',
        'アップロード先のフォルダIDが設定されていません。'
      );
      const parentFolder = DriveApp.getFolderById(parentFolderId);
      const folderName = `${
        incidentData.caseName
      }_${incidentDate.getFullYear()}${(incidentDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${incidentDate
        .getDate()
        .toString()
        .padStart(2, '0')}`;
      const newFolder = parentFolder.createFolder(folderName);
      driveFolderUrl = newFolder.getUrl();

      // --- Update Drive Permissions Start ---
      const adminEmails = getAdminEmails(ss);
      adminEmails.forEach(admin => {
        newFolder.addEditor(admin);
      });
      newFolder.addEditor(userEmail); // 念のため作成者も追加
      // --- Update Drive Permissions End ---

      const templateSheetId = getScriptProperty(
        'TEMPLATE_SHEET_ID',
        'テンプレートスプレッドシートIDが設定されていません。'
      );
      const templateFile = DriveApp.getFileById(templateSheetId);
      const newSheet = templateFile.makeCopy(
        `${incidentData.caseName}_詳細`,
        newFolder
      );
      incidentDetailUrl = newSheet.getUrl();

      const detailSheet = SpreadsheetApp.openById(newSheet.getId());
      const sheet = detailSheet.getSheetByName('詳細');
      if (sheet) {
        sheet.getRange('B1').setValue(incidentData.summary);
        sheet.getRange('B2').setValue(incidentData.stakeholders);
        sheet.getRange('B3').setValue(incidentData.details);

        if (incidentData.fileDataList && incidentData.fileDataList.length > 0) {
          const folderId = newFolder.getId();
          const cell = sheet.getRange('B4');
          const richTextBuilder = SpreadsheetApp.newRichTextValue();
          let text = '';

          incidentData.fileDataList.forEach((fileData, index) => {
            const fileUrl = uploadFileToDrive(fileData, folderId);
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
      }

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

    if (isEditMode) {
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

      if (incidentDetailUrl) {
        const detailSheetId = extractSheetIdFromUrl(incidentDetailUrl);
        const detailSheet = SpreadsheetApp.openById(detailSheetId);
        const sheet = detailSheet.getSheetByName('詳細');
        if (sheet) {
          sheet.getRange('B1').setValue(incidentData.summary);
          sheet.getRange('B2').setValue(incidentData.stakeholders);
          sheet.getRange('B3').setValue(incidentData.details);

          if (
            incidentData.fileDataList &&
            incidentData.fileDataList.length > 0
          ) {
            const folderId = extractFolderIdFromUrl(driveFolderUrl);
            const cell = sheet.getRange('B4');
            const richTextBuilder = SpreadsheetApp.newRichTextValue();
            let text = '';

            incidentData.fileDataList.forEach((fileData, index) => {
              const fileUrl = uploadFileToDrive(fileData, folderId);
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
        }
      }
    }

    const record: IncidentRecord = {
      registeredDate: incidentDate.toLocaleString('ja-JP'),
      registeredUser: originalUserEmail,
      caseName: incidentData.caseName,
      assignee: incidentData.assignee,
      status: incidentData.status,
      updateDate: updateDate.toLocaleString('ja-JP'),
      driveFolderUrl: driveFolderUrl,
      incidentDetailUrl: incidentDetailUrl,
    };

    return {
      success: true,
      message: 'インシデント情報を登録しました',
      incidentDate: incidentDate.toISOString(),
      record: record,
    };
  } catch (error) {
    console.error('submitIncident error:', error);
    throw new Error(`登録処理エラー: ${(error as Error).message}`);
  }
}
