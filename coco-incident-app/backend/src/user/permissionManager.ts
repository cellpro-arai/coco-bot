import { CurrentUserAndAllUsers } from './types';
import { getAllPermissions } from './getAllPermissions';

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
