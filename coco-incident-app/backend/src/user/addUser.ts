import { grantCSVAccess } from '../drive/grantCSVAccess';
import { grantFolderAccess } from '../drive/grantFolderAccess';
import { grantSpreadsheetAccess } from '../sheet/grantSpreadsheetAccess';
import { getSlackAccountByEmail } from '../slack/getSlackUser';
import { UserRole } from './constants';
import { getAllPermissions } from './getAllPermissions';
import { UserPermission } from './types';
import { updatePermissionsFile } from './updatePermissionsFile';

/**
 * ユーザーを追加
 */
export function addUser(email: string, role: UserRole): UserPermission {
  try {
    if (!email || !role) {
      throw new Error('メールアドレスとロールが必須です。');
    }

    // メールアドレスからSlack User IDを取得
    const slackAccount = getSlackAccountByEmail(email);
    if (!slackAccount) {
      throw new Error(
        `Slackユーザーが見つかりません: ${email}\nSlackワークスペースに登録されているメールアドレスを使用してください。`
      );
    }

    const newUser: UserPermission = {
      email,
      role,
      slackUserId: slackAccount.id,
    };

    // 既存のすべての権限を取得
    const permissions = getAllPermissions();

    // 重複チェック
    if (permissions.some(p => p.email === email)) {
      throw new Error(`このメールアドレスは既に登録されています: ${email}`);
    }

    // 新しいユーザーを追加
    permissions.push(newUser);

    // CSVとキャッシュを更新
    updatePermissionsFile(permissions);

    // アクセス権限を付与
    try {
      grantSpreadsheetAccess(email);
      grantFolderAccess(email);
      grantCSVAccess(email, role);
      console.log(`${email} にすべてのアクセス権限を付与しました。`);
    } catch (accessError) {
      console.error(
        `権限付与中にエラーが発生しました。ユーザーはCSVには追加されていますが、アクセス権限の付与に失敗した可能性があります: ${(accessError as Error).message}`
      );
      throw new Error(
        `ユーザーの追加は完了しましたが、アクセス権限の付与に失敗しました: ${(accessError as Error).message}`
      );
    }

    return newUser;
  } catch (error) {
    console.error('addUser error:', error);
    throw new Error(`ユーザー追加に失敗しました: ${(error as Error).message}`);
  }
}
