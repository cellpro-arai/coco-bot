import { FileData } from '../drive/types';

export const INCIDENT_SHEET_NAME = 'インシデント管理';

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
