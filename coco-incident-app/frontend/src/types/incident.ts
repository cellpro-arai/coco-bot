/**
 * インシデント一覧表示用型
 */
import { AiAnalysisStatus } from './constants';

export interface Incident {
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
  improvementSuggestions?: string; // 編集画面で使用
  aiAnalysisStatus?: AiAnalysisStatus;
  aiAnalysis?: string;
}
