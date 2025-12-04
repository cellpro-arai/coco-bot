/**
 * ユーザーの権限情報
 */
export type UserPermission = {
  email: string;
  role: 'admin' | 'user';
  slackUserId: string;
};

/**
 * ユーザー権限の管理情報
 */
export type PermissionRecord = {
  email: string;
  role: string;
  slackUserId: string;
};
