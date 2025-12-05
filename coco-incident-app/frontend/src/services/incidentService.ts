/**
 * @fileoverview インシデント管理に関する Google Apps Script との通信
 */
import {
  Incident,
  IncidentFormData,
  IncidentResult,
  AI_ANALYSIS_STATUS,
} from '../types';

const shouldSimulatePermissionError =
  localStorage.getItem('simulatePermissionError') === 'true';

/**
 * インシデント一覧を取得します。
 * @returns {Promise<Incident[]>} インシデントのリスト
 */
export function getIncidentList(): Promise<Incident[]> {
  return new Promise((resolve, reject) => {
    if (import.meta.env.DEV) {
      // 開発環境用のモックデータ
      setTimeout(() => {
        if (shouldSimulatePermissionError) {
          reject(new Error('権限がありません。管理者に問い合わせてください。'));
          return;
        }
        resolve([
          {
            registeredDate: '2025/1/15 10:30:00',
            registeredUser: 'dev@example.com',
            caseName: 'システムダウン',
            assignee: '山田太郎',
            status: '対応中',
            updateDate: '2025/1/15 14:30:00',
            driveFolderUrl: 'https://drive.google.com/drive/folders/mock1',
            incidentDetailUrl: 'https://docs.google.com/spreadsheets/d/mock1',
            summary: 'サーバーがダウンし、サービスにアクセスできない状態',
            stakeholders: '顧客: 株式会社ABC 田中様\n社内: 開発部 鈴木課長',
            details:
              '【発生日時】2025年1月15日 10:00頃\n【現象】503エラーが表示される\n【影響範囲】全ユーザー',
            attachments: 'error_log.txt\nscreenshot.png',
            improvementSuggestions: '定期的な監視体制の強化を推奨します',
            aiAnalysisStatus: AI_ANALYSIS_STATUS.PENDING,
          },
          {
            registeredDate: '2025/1/14 09:00:00',
            registeredUser: 'dev@example.com',
            caseName: 'データ不整合',
            assignee: '佐藤花子',
            status: '解決済み',
            updateDate: '2025/1/15 16:00:00',
            driveFolderUrl: 'https://drive.google.com/drive/folders/mock2',
            incidentDetailUrl: 'https://docs.google.com/spreadsheets/d/mock2',
            summary: 'データベースの一部データに不整合が発見された',
            stakeholders: '社内: データ管理部 高橋主任',
            details:
              '【発生日時】2025年1月14日\n【現象】顧客データの一部が重複\n【対応】重複データを削除し、正常化',
            aiAnalysisStatus: AI_ANALYSIS_STATUS.COMPLETED,
            aiAnalysis:
              '【AI解析結果】\n根本原因: データベースの同期処理に不具合\n推奨対策:\n1. 同期処理のロジック見直し\n2. 重複チェック機能の実装\n3. 定期的なデータ整合性確認',
          },
        ]);
      }, 500);
    } else {
      google.script.run
        .withSuccessHandler((result: Incident[]) => resolve(result))
        .withFailureHandler((error: Error) =>
          reject(new Error(`データの読み込みに失敗しました: ${error.message}`))
        )
        .getIncidentList();
    }
  });
}

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
          aiAnalysisStatus: AI_ANALYSIS_STATUS.PENDING,
        };

        resolve({
          success: true,
          message: `インシデント情報を${actionType}しました`,
          incidentDate: now.toISOString(),
          record: record,
          improvementSuggestions: `【開発モック】インシデント情報を${actionType}しました\n\n改善提案:\n- 定期的な監視体制の強化\n- ドキュメント化の推進\n- 再発防止策の検討`,
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
