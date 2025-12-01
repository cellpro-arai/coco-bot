/**
 * インシデントフォーム入力データ型
 */
import { FileData } from './file';

export interface IncidentFormData {
  registeredDate: string; // 編集モードの場合に設定される（識別子として使用）
  caseName: string;
  assignee: string;
  summary: string;
  stakeholders: string;
  details: string;
  status: string;
  fileDataList: FileData[];
}
