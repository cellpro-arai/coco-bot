import { UserRole } from '../types/constants';

/**
 * ユーザーの権限情報
 */
export type UserPermission = {
  email: string;
  role: UserRole;
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

/**
 * 現在のユーザーと全ユーザーの情報
 */
export type CurrentUserAndAllUsers = {
  current_user: string;
  role: UserRole;
  users: UserPermission[];
};
