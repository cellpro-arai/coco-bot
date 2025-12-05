import { USER_ROLE, UserRole } from '../permissions/constants';
import { getPermissionsCsvFileId } from '../properties';

/**
 * CSVファイルのアクセス権限を付与（管理者は書き込み、ユーザーは読み取り）
 */
export function grantCSVAccess(email: string, role: UserRole): void {
  try {
    const csvFileId = getPermissionsCsvFileId();

    const file = DriveApp.getFileById(csvFileId);

    if (role === USER_ROLE.ADMIN) {
      // 管理者には編集権限を付与
      file.addEditor(email);
      console.log(`${email} にCSVファイル編集権限を付与しました。`);
    } else {
      // ユーザーには閲覧権限を付与
      file.addViewer(email);
      console.log(`${email} にCSVファイル閲覧権限を付与しました。`);
    }
  } catch (error) {
    console.error('grantCSVAccess error:', error);
    throw new Error(`CSV権限付与に失敗しました: ${(error as Error).message}`);
  }
}
