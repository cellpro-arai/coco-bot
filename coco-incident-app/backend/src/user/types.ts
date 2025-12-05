import { UserRole } from './constants';

/**
 * ユーザーの権限情報
 */
export type UserPermission = {
  email: string;
  role: UserRole;
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
