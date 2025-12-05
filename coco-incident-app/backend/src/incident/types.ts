import { FileData } from '../drive/types';
import { UserRole } from '../user/constants';
import { UserPermission } from '../user/types';

export const INCIDENT_SHEET_NAME = 'インシデント管理';

/**
 * 初期表示時のデータ
 */
export interface InitialData {
  current_user: string;
  role: UserRole;
  users: UserPermission[];
  upload_folder_url: string;
  incidents: IncidentRecord[];
}

/**
 * インシデントデータの型定義
 */
export interface IncidentData {
  registeredDate?: string;
  caseName: string;
  assignee: string;
  summary: string;
  stakeholders: string;
  details: string;
  status: string;
  fileDataList: FileData[];
}

/**
 * インシデント登録結果の型定義
 */
export interface IncidentResult {
  success: boolean;
  message: string;
  incidentDate: string;
  record: IncidentRecord;
}

/**
 * インシデント一覧取得用の型定義
 */
export interface IncidentRecord {
  registeredDate: string;
  registeredUser: string;
  caseName: string;
  assignee: string;
  status: string;
  updateDate: string;
  driveFolderUrl: string;
  incidentDetailUrl: string;
  summary?: string;
  stakeholders?: string;
  details?: string;
  attachments?: string;
}
