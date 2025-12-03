/**
 * @fileoverview Google Apps Scriptとの通信
 */
import { ExpenseSubmitData, ExpenseResult } from '../types';

declare const google: any;

const isDevelopment = typeof google === 'undefined';

/**
 * 経費を提出します。
 * @param {ExpenseSubmitData} data フォームデータ
 * @returns {Promise<ExpenseResult>} 登録結果
 */
export function submitExpense(data: ExpenseSubmitData): Promise<ExpenseResult> {
  return new Promise((resolve, reject) => {
    if (isDevelopment) {
      // 開発環境用のモック
      setTimeout(() => {
        console.log('[開発モード] 経費提出:', data);
        resolve({
          success: true,
          message: '経費情報を登録しました（開発モード）',
        });
      }, 1000);
    } else {
      google.script.run
        .withSuccessHandler((result: ExpenseResult) => resolve(result))
        .withFailureHandler((error: Error) =>
          reject(new Error(`送信に失敗しました: ${error.message}`))
        )
        .submitExpense(data);
    }
  });
}
