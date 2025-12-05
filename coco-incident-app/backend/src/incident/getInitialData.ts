import { InitialData } from './types';
import { getAllPermissions } from '../user/getAllPermissions';
import { getUploadFolderUrl } from '../drive/getUploadFolderUrl';
import { getIncidentList } from './getIncidentList';

/**
 * 初期表示時のデータ取得
 * インシデント詳細のDriveパス, 現在のユーザー, 全ユーザーの情報を取得
 */
export function getInitialData(): InitialData {
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

    // アップロード先フォルダのURLを取得
    const uploadFolderUrl = getUploadFolderUrl();

    // インシデント一覧を取得
    const incidents = getIncidentList(currentUserEmail, currentUser.role);

    return {
      current_user: currentUserEmail,
      role: currentUser.role,
      users: permissions,
      upload_folder_url: uploadFolderUrl,
      incidents: incidents,
    };
  } catch (error) {
    console.error('getCurrentUserAndAll error:', error);
    throw new Error(
      `ユーザー情報の取得に失敗しました: ${(error as Error).message}`
    );
  }
}
