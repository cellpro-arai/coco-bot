import { getSlackAccountByEmail } from '../slack/getSlackUser';
import { UserPermission, CurrentUserAndAllUsers } from './permissionTypes';
import {
  getPermissionsCsvFileId,
  getSpreadSheetId,
  getUploadFolderId,
} from '../properties';

/**
 * グローバルキャッシュキー
 */
const PERMISSIONS_CACHE_KEY = 'permissions_cache';

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
          role: role as 'admin' | 'user',
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

/**
 * スプレッドシートへのアクセス権限を付与
 */
export function grantSpreadsheetAccess(email: string): void {
  try {
    const spreadsheetId = getSpreadSheetId();

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    spreadsheet.addEditor(email);

    console.log(`${email} にスプレッドシート編集権限を付与しました。`);
  } catch (error) {
    console.error('grantSpreadsheetAccess error:', error);
    throw new Error(
      `スプレッドシート権限付与に失敗しました: ${(error as Error).message}`
    );
  }
}

/**
 * ドライブフォルダへのアクセス権限を付与
 */
export function grantFolderAccess(email: string): void {
  try {
    const uploadFolderId = getUploadFolderId();

    const folder = DriveApp.getFolderById(uploadFolderId);
    folder.addEditor(email);

    console.log(`${email} にドライブフォルダ編集権限を付与しました。`);
  } catch (error) {
    console.error('grantFolderAccess error:', error);
    throw new Error(
      `ドライブ権限付与に失敗しました: ${(error as Error).message}`
    );
  }
}

/**
 * CSVファイルのアクセス権限を付与（管理者は書き込み、ユーザーは読み取り）
 */
export function grantCSVAccess(email: string, role: 'admin' | 'user'): void {
  try {
    const csvFileId = getPermissionsCsvFileId();

    const file = DriveApp.getFileById(csvFileId);

    if (role === 'admin') {
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

/**
 * スプレッドシートのアクセス権限を剥奪
 */
export function revokeSpreadsheetAccess(email: string): void {
  try {
    const spreadsheetId = getSpreadSheetId();

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    spreadsheet.removeEditor(email);

    console.log(`${email} のスプレッドシート編集権限を剥奪しました。`);
  } catch (error) {
    console.error('revokeSpreadsheetAccess error:', error);
    throw new Error(
      `スプレッドシート権限剥奪に失敗しました: ${(error as Error).message}`
    );
  }
}

/**
 * ドライブフォルダのアクセス権限を剥奪
 */
export function revokeFolderAccess(email: string): void {
  try {
    const uploadFolderId = getUploadFolderId();

    const folder = DriveApp.getFolderById(uploadFolderId);
    folder.removeEditor(email);

    console.log(`${email} のドライブフォルダ編集権限を剥奪しました。`);
  } catch (error) {
    console.error('revokeFolderAccess error:', error);
    throw new Error(
      `ドライブ権限剥奪に失敗しました: ${(error as Error).message}`
    );
  }
}

/**
 * CSVファイルのアクセス権限を剥奪
 */
export function revokeCSVAccess(email: string): void {
  try {
    const csvFileId = getPermissionsCsvFileId();

    const file = DriveApp.getFileById(csvFileId);
    file.removeEditor(email);
    file.removeViewer(email);

    console.log(`${email} のCSVファイルアクセス権限を剥奪しました。`);
  } catch (error) {
    console.error('revokeCSVAccess error:', error);
    throw new Error(`CSV権限剥奪に失敗しました: ${(error as Error).message}`);
  }
}
