/**
 * @fileoverview インシデント管理に関する Google Apps Script との通信
 */
import { Incident, IncidentFormData, IncidentResult } from '../types';

const shouldSimulatePermissionError =
  localStorage.getItem('simulatePermissionError') === 'true';

/**
 * インシデントを登録または更新します。
 * @param {IncidentFormData} data フォームデータ
 * @returns {Promise<IncidentResult>} 登録結果
 */
export function submitIncident(
  data: IncidentFormData
): Promise<IncidentResult> {
  return new Promise((resolve, reject) => {
    if (import.meta.env.DEV) {
      // 開発環境用のモック
      setTimeout(() => {
        if (shouldSimulatePermissionError) {
          reject(new Error('権限がありません。管理者に問い合わせてください。'));
          return;
        }

        const isUpdate =
          data.registeredDate && data.registeredDate.trim() !== '';
        const actionType = isUpdate ? '更新' : '登録';
        console.log(`[開発モード] インシデント${actionType}:`, data);

        const now = new Date();
        const record: Incident = {
          registeredDate: isUpdate
            ? data.registeredDate
            : now.toLocaleString('ja-JP'),
          registeredUser: 'dev@example.com',
          caseName: data.caseName,
          assignee: data.assignee,
          status: data.status,
          updateDate: now.toLocaleString('ja-JP'),
          driveFolderUrl: `https://drive.google.com/drive/folders/mock_${now.getTime()}`,
          incidentDetailUrl: `https://docs.google.com/spreadsheets/d/mock_${now.getTime()}`,
          summary: data.summary,
          stakeholders: data.stakeholders,
          details: data.details,
          attachments: data.fileDataList.map(f => f.name).join('\n'),
        };

        resolve({
          success: true,
          message: `インシデント情報を${actionType}しました`,
          incidentDate: now.toISOString(),
          record: record,
        });
      }, 1000);
    } else {
      google.script.run
        .withSuccessHandler((result: IncidentResult) => resolve(result))
        .withFailureHandler((error: Error) =>
          reject(new Error(`送信に失敗しました: ${error.message}`))
        )
        .submitIncident(data);
    }
  });
}
