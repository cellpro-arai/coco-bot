import { getSlackAccountByEmail } from '../slack/getSlackUser';
import { UserRole } from './constants';
import { getPermissionsCsvFileId } from '../properties';
import { grantFolderAccess } from '../drive/grantFolderAccess';
import { grantCSVAccess } from '../drive/grantCSVAccess';
import { grantSpreadsheetAccess } from '../sheet/grantSpreadsheetAccess';
import { revokeSpreadsheetAccess } from '../sheet/revokeSpreadsheetAccess';
import { revokeFolderAccess } from '../drive/revokeFolderAccess';
import { revokeCSVAccess } from '../drive/revokeCSVAccess';

/**
 * グローバルキャッシュキー
 */
const PERMISSIONS_CACHE_KEY = 'permissions_cache';

/**
 * ユーザーの権限情報
 */
type UserPermission = {
  email: string;
  role: UserRole;
  slackUserId: string;
};

/**
 * 現在のユーザーと全ユーザーの情報
 */
type CurrentUserAndAllUsers = {
  current_user: string;
  role: UserRole;
  users: UserPermission[];
};

/**
 * 現在のユーザーと全ユーザーの情報を取得
 */
export function getCurrentUserAndAll(): CurrentUserAndAllUsers {
  try {
    const currentUserEmail = Session.getEffectiveUser().getEmail();

    // すべてのユーザー権限を取得（キャッシュを利用）
    const permissions = getAllPermissions();

    // 現在のユーザー情報を取得
    const currentUser = permissions.find(p => p.email === currentUserEmail);

    if (!currentUser) {
      throw new Error(
        `現在のユーザーが権限管理に登録されていません: ${currentUserEmail}`
      );
    }

    return {
      current_user: currentUserEmail,
      role: currentUser.role,
      users: permissions,
    };
  } catch (error) {
    console.error('getCurrentUserAndAll error:', error);
    throw new Error(
      `ユーザー情報の取得に失敗しました: ${(error as Error).message}`
    );
  }
}

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
