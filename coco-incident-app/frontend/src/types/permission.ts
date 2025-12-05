/**
 * ユーザーの権限情報
 */
export interface UserPermission {
  email: string;
  role: 'admin' | 'user';
  slackUserId: string;
}

/**
 * 現在のユーザーと全ユーザーの情報
 */
export interface CurrentUserAndAllUsers {
  current_user: string;
  role: 'admin' | 'user';
  users: UserPermission[];
}

/**
 * 権限追加/削除時の結果
 */
export interface PermissionResult {
  success: boolean;
  message: string;
  data?: UserPermission;
}
