import { getPermissionsCsvFileId } from '../properties';
import { PERMISSIONS_CACHE_KEY } from './constants';
import { UserPermission } from './types';

/**
 * 権限情報をCSVファイルとキャッシュに保存
 */
export function updatePermissionsFile(permissions: UserPermission[]): void {
  try {
    // CSV形式に変換
    let csvContent = 'email,role,slackUserId\n';
    permissions.forEach(p => {
      csvContent += `${p.email},${p.role},${p.slackUserId}\n`;
    });

    // ファイルを更新
    const csvFileId = getPermissionsCsvFileId();

    const file = DriveApp.getFileById(csvFileId);
    file.setContent(csvContent);

    // キャッシュを更新
    const cache = CacheService.getScriptCache();
    cache.put(PERMISSIONS_CACHE_KEY, JSON.stringify(permissions), 21600); // 6時間
  } catch (error) {
    console.error('updatePermissionsFile error:', error);
    throw new Error(
      `権限ファイルの更新に失敗しました: ${(error as Error).message}`
    );
  }
}
