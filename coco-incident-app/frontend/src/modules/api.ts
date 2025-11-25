/**
 * @fileoverview Google Apps Scriptとの通信
 */
import { Incident, IncidentFormData } from './types';

declare const google: any;

const isDevelopment = typeof google === 'undefined';

/**
 * インシデント一覧を取得します。
 * @returns {Promise<Incident[]>} インシデントのリスト
 */
export function getIncidentList(): Promise<Incident[]> {
  return new Promise((resolve, reject) => {
    if (isDevelopment) {
      // 開発環境用のモックデータ
      setTimeout(() => {
        resolve([
          {
            registeredDate: '2025-01-15',
            registeredUser: 'dev@example.com',
            caseName: 'システムダウン',
            assignee: '山田太郎',
            status: '対応中',
            updateDate: '2025-01-15',
            driveFolderUrl: '#',
            incidentDetailUrl: '#',
          },
          {
            registeredDate: '2025-01-14',
            registeredUser: 'dev@example.com',
            caseName: 'データ不整合',
            assignee: '佐藤花子',
            status: '完了',
            updateDate: '2025-01-15',
            driveFolderUrl: '#',
            incidentDetailUrl: '#',
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
 * @returns {Promise<{ improvementSuggestions: string }>} 改善提案
 */
export function submitIncident(
  data: IncidentFormData
): Promise<{ improvementSuggestions: string }> {
  return new Promise((resolve, reject) => {
    if (isDevelopment) {
      // 開発環境用のモック
      setTimeout(() => {
        resolve({ improvementSuggestions: '【モック】改善案が表示されます' });
      }, 1000);
    } else {
      google.script.run
        .withSuccessHandler((result: { improvementSuggestions: string }) =>
          resolve(result)
        )
        .withFailureHandler((error: Error) =>
          reject(new Error(`送信に失敗しました: ${error.message}`))
        )
        .submitIncident(data);
    }
  });
}
