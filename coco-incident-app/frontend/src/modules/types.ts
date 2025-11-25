/**
 * @fileoverview frontend/src/modules/types.ts
 */

/**
 * AI解析ステータスの定数
 */
export const AI_ANALYSIS_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  NONE: 'none',
} as const;

export type AiAnalysisStatus = typeof AI_ANALYSIS_STATUS[keyof typeof AI_ANALYSIS_STATUS];

/**
 * ファイルデータの型定義
 */
export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded
}

/**
 * インシデントのフォーム入力データを表す型
 */
export interface IncidentFormData {
  registeredDate: string; // 編集モードの場合に設定される（識別子として使用）
  caseName: string;
  assignee: string;
  summary: string;
  stakeholders: string;
  details: string;
  status: string;
  fileDataList: FileData[];
  previousAiSuggestions: string; // 編集時の前回AI改善案
}

/**
 * インシデント一覧で表示される各インシデントの型
 * バックエンドのIncidentRecordに対応
 */
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
  // フロントエンドで独自に使うプロパティ
  improvementSuggestions?: string; // 編集画面で使うことがある
  aiAnalysisStatus?: AiAnalysisStatus;
  aiAnalysis?: string;
}

/**
 * インシデント送信結果の型
 * バックエンドのIncidentResultに対応
 */
export interface IncidentResult {
  success: boolean;
  message: string;
  incidentDate: string;
  record: Incident;
  improvementSuggestions?: string;
}
