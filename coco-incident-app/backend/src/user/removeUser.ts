import { revokeCSVAccess } from '../drive/revokeCSVAccess';
import { revokeFolderAccess } from '../drive/revokeFolderAccess';
import { revokeSpreadsheetAccess } from '../sheet/revokeSpreadsheetAccess';
import { getAllPermissions } from './getAllPermissions';
import { updatePermissionsFile } from './updatePermissionsFile';

/**
 * ユーザーを削除
 */
export function removeUser(email: string): void {
  try {
    if (!email) {
      throw new Error('メールアドレスが必須です。');
    }

    // 既存のすべての権限を取得
    const permissions = getAllPermissions();

    // 削除対象のインデックスを探す
    const userIndex = permissions.findIndex(p => p.email === email);
    if (userIndex === -1) {
      throw new Error(`ユーザーが見つかりません: ${email}`);
    }

    // ユーザーを削除
    permissions.splice(userIndex, 1);

    // CSVとキャッシュを更新
    updatePermissionsFile(permissions);

    // アクセス権限を剥奪
    try {
      revokeSpreadsheetAccess(email);
      revokeFolderAccess(email);
      revokeCSVAccess(email);
      console.log(`${email} のすべてのアクセス権限を剥奪しました。`);
    } catch (accessError) {
      console.error(
        `権限剥奪中にエラーが発生しました: ${(accessError as Error).message}`
      );
      throw new Error(
        `ユーザーの削除は完了しましたが、アクセス権限の剥奪に失敗しました: ${(accessError as Error).message}`
      );
    }
  } catch (error) {
    console.error('removeUser error:', error);
    throw new Error(`ユーザー削除に失敗しました: ${(error as Error).message}`);
  }
}
