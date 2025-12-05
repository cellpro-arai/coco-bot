/**
 * @fileoverview 権限管理に関する Google Apps Script との通信
 */
import { UserPermission, InitialData, USER_ROLE, UserRole } from '../types';

/**
 * 初期表示時のすべてのデータを取得します（ユーザー権限、インシデント、アップロードフォルダURL）。
 * @returns {Promise<InitialData>} 初期表示に必要なすべてのデータ
 */
export function getInitialData(): Promise<InitialData> {
  return new Promise((resolve, reject) => {
    if (import.meta.env.DEV) {
      // 開発環境用のモックデータ
      setTimeout(() => {
        resolve({
          current_user: 'admin@example.com',
          role: USER_ROLE.ADMIN,
          users: [
            {
              email: 'admin@example.com',
              role: USER_ROLE.ADMIN,
              slackUserId: 'U123456789',
            },
            {
              email: 'user1@example.com',
              role: USER_ROLE.USER,
              slackUserId: 'U987654321',
            },
            {
              email: 'user2@example.com',
              role: USER_ROLE.USER,
              slackUserId: 'U111111111',
            },
          ],
          upload_folder_url:
            'https://drive.google.com/drive/folders/mock-folder-id',
          incidents: [
            {
              registeredDate: '2025/1/15 10:30:00',
              registeredUser: 'dev@example.com',
              caseName: 'システムダウン',
              assignee: '山田太郎',
              status: '対応中',
              updateDate: '2025/1/15 14:30:00',
              driveFolderUrl: 'https://drive.google.com/drive/folders/mock1',
              incidentDetailUrl:
                'https://drive.google.com/drive/folders/mock-detail1',
            },
          ],
        });
      }, 300);
    } else {
      google.script.run
        .withSuccessHandler((result: InitialData) => resolve(result))
        .withFailureHandler((error: Error) =>
          reject(new Error(`初期データの取得に失敗しました: ${error.message}`))
        )
        .getInitialData();
    }
  });
}

/**
 * ユーザーを追加します。
 * @param {string} email メールアドレス
 * @param {string} role ロール (admin | user)
 * @returns {Promise<UserPermission>} 追加されたユーザー情報
 */
export function addUser(
  email: string,
  role: UserRole
): Promise<UserPermission> {
  return new Promise((resolve, reject) => {
    if (import.meta.env.DEV) {
      // 開発環境用のモック
      setTimeout(() => {
        const newUser: UserPermission = {
          email,
          role,
          slackUserId: `U${Math.random().toString().substring(2, 11)}`,
        };
        console.log('[開発モード] ユーザー追加:', newUser);
        resolve(newUser);
      }, 500);
    } else {
      google.script.run
        .withSuccessHandler((result: UserPermission) => resolve(result))
        .withFailureHandler((error: Error) =>
          reject(new Error(`ユーザー追加に失敗しました: ${error.message}`))
        )
        .addUser(email, role);
    }
  });
}

/**
 * ユーザーを削除します。
 * @param {string} email メールアドレス
 * @returns {Promise<void>}
 */
export function removeUser(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (import.meta.env.DEV) {
      // 開発環境用のモック
      setTimeout(() => {
        console.log('[開発モード] ユーザー削除:', email);
        resolve();
      }, 500);
    } else {
      google.script.run
        .withSuccessHandler(() => resolve())
        .withFailureHandler((error: Error) =>
          reject(new Error(`ユーザー削除に失敗しました: ${error.message}`))
        )
        .removeUser(email);
    }
  });
}
