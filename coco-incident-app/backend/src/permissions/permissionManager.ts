import { getScriptProperty } from '../utils';
import { getSlackAccountByEmail } from '../slack/getSlackUser';
import { UserPermission } from './permissionTypes';

/**
 * グローバルキャッシュキー
 */
const PERMISSIONS_CACHE_KEY = 'permissions_cache';

/**
 * CSVファイルからすべてのユーザー権限を取得
 */
export function getAllPermissions(): UserPermission[] {
  try {
    const csvFileId = getScriptProperty(
      'PERMISSIONS_CSV_FILE_ID',
      '権限管理CSVファイルIDが設定されていません。'
    );

    const file = DriveApp.getFileById(csvFileId);
    const csvContent = file.getBlob().getDataAsString();

    const permissions: UserPermission[] = [];
    const lines = csvContent.split('\n');

    // ヘッダー行をスキップして処理
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [email, role, slackUserId] = line.split(',').map(v => v.trim());

      if (email && role && slackUserId) {
        permissions.push({
          email,
          role: role as 'admin' | 'user',
          slackUserId,
        });
      }
    }

    // キャッシュに保存
    const cache = CacheService.getScriptCache();
    cache.put(PERMISSIONS_CACHE_KEY, JSON.stringify(permissions), 21600); // 6時間

    return permissions;
  } catch (error) {
    console.error('getAllPermissions error:', error);
    throw new Error(
      `権限情報の取得に失敗しました: ${(error as Error).message}`
    );
  }
}

/**
 * キャッシュから権限情報を取得
 */
export function getPermissionsFromCache(): UserPermission[] | null {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(PERMISSIONS_CACHE_KEY);

    if (cached) {
      return JSON.parse(cached) as UserPermission[];
    }
    return null;
  } catch (error) {
    console.error('getPermissionsFromCache error:', error);
    return null;
  }
}

/**
 * ユーザーを追加
 */
export function addUser(email: string, role: 'admin' | 'user'): UserPermission {
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

    return newUser;
  } catch (error) {
    console.error('addUser error:', error);
    throw new Error(`ユーザー追加に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * ユーザーを更新
 */
export function updateUser(
  email: string,
  role: 'admin' | 'user'
): UserPermission {
  try {
    if (!email || !role) {
      throw new Error('メールアドレスとロールが必須です。');
    }

    // 既存のすべての権限を取得
    const permissions = getAllPermissions();

    // 更新対象を探す
    const userIndex = permissions.findIndex(p => p.email === email);
    if (userIndex === -1) {
      throw new Error(`ユーザーが見つかりません: ${email}`);
    }

    // ロールを更新
    permissions[userIndex].role = role;

    // CSVとキャッシュを更新
    updatePermissionsFile(permissions);

    return permissions[userIndex];
  } catch (error) {
    console.error('updateUser error:', error);
    throw new Error(`ユーザー更新に失敗しました: ${(error as Error).message}`);
  }
}

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
  } catch (error) {
    console.error('removeUser error:', error);
    throw new Error(`ユーザー削除に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * 指定されたメールアドレスのユーザー権限を取得
 */
export function getUserPermission(email: string): UserPermission | null {
  try {
    // キャッシュから取得を試みる
    let permissions = getPermissionsFromCache();

    if (!permissions) {
      permissions = getAllPermissions();
    }

    return permissions.find(p => p.email === email) || null;
  } catch (error) {
    console.error('getUserPermission error:', error);
    return null;
  }
}

/**
 * メールアドレスがadminかどうかを判定
 */
export function isUserAdmin(email: string): boolean {
  const permission = getUserPermission(email);
  return permission?.role === 'admin';
}

/**
 * 権限情報をCSVファイルとキャッシュに保存
 */
function updatePermissionsFile(permissions: UserPermission[]): void {
  try {
    // CSV形式に変換
    let csvContent = 'email,role,slackUserId\n';
    permissions.forEach(p => {
      csvContent += `${p.email},${p.role},${p.slackUserId}\n`;
    });

    // ファイルを更新
    const csvFileId = getScriptProperty(
      'PERMISSIONS_CSV_FILE_ID',
      '権限管理CSVファイルIDが設定されていません。'
    );

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
