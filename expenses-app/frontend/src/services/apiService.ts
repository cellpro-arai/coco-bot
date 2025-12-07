/**
 * @fileoverview Google Apps Scriptとの通信
 */
import { ExpenseSubmitData, ExpenseResult, EmployeeInfo } from '../types';

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
          reject(new Error(error.message))
        )
        .submitExpense(data);
    }
  });
}

/**
 * 現在のユーザーの従業員情報を取得します。
 * @returns {Promise<EmployeeInfo | null>} 従業員情報。見つからない場合はnull
 */
export function getUserInfo(): Promise<EmployeeInfo | null> {
  return new Promise((resolve, reject) => {
    if (isDevelopment) {
      // 開発環境用のモック
      setTimeout(() => {
        console.log('[開発モード] ユーザー情報取得');
        resolve({
          employeeId: '001',
          name: '山田 太郎',
          email: 'yamada@example.com',
          isActive: true,
        });
      }, 500);
    } else {
      google.script.run
        .withSuccessHandler((result: EmployeeInfo | null) => resolve(result))
        .withFailureHandler((error: Error) =>
          reject(new Error(error.message))
        )
        .getUserInfo();
    }
  });
}
