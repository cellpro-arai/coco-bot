import { getPermissionsCsvFileId } from '../properties';
import { PERMISSIONS_CACHE_KEY, UserRole } from './constants';
import { UserPermission } from './types';

/**
 * CSVファイルからすべてのユーザー権限を取得（キャッシュを使用）
 */
export function getAllPermissions(): UserPermission[] {
  try {
    // キャッシュから取得を試みる
    const cache = CacheService.getScriptCache();
    const cached = cache.get(PERMISSIONS_CACHE_KEY);

    // キャッシュが存在し、空でない場合はそれを使用
    if (cached && cached.trim() !== '') {
      return JSON.parse(cached) as UserPermission[];
    }

    // キャッシュが空または存在しない場合はCSVから取得
    const csvFileId = getPermissionsCsvFileId();

    const file = DriveApp.getFileById(csvFileId);
    const csvContent = file.getBlob().getDataAsString();

    const permissions: UserPermission[] = [];
    const lines = csvContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [email, role, slackUserId] = line.split(',').map(v => v.trim());

      if (email && role && slackUserId) {
        permissions.push({
          email,
          role: role as UserRole,
          slackUserId,
        });
      }
    }

    // キャッシュに保存
    cache.put(PERMISSIONS_CACHE_KEY, JSON.stringify(permissions), 21600); // 6時間

    return permissions;
  } catch (error) {
    console.error('getAllPermissions error:', error);
    throw new Error(
      `権限情報の取得に失敗しました: ${(error as Error).message}`
    );
  }
}
