import { Incident } from './incident';

/**
 * ユーザーロールの定数
 */
export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/**
 * ユーザーの権限情報
 */
export interface UserPermission {
  email: string;
  role: UserRole;
  slackUserId: string;
}

/**
 * 現在のユーザーと全ユーザーの情報
 */
export interface CurrentUserAndAllUsers {
  current_user: string;
  role: UserRole;
  users: UserPermission[];
}

/**
 * 初期表示時のすべてのデータ
 */
export interface InitialData extends CurrentUserAndAllUsers {
  upload_folder_url: string;
  incidents: Incident[];
}
