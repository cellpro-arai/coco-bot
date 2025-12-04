/**
 * ユーザーの権限情報
 */
export interface UserPermission {
  email: string;
  role: 'admin' | 'user';
  slackUserId: string;
}

/**
 * 権限追加/削除時の結果
 */
export interface PermissionResult {
  success: boolean;
  message: string;
  data?: UserPermission;
}
