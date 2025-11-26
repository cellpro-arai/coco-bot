/**
 * AI解析ステータスの定数
 */
const AI_ANALYSIS_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  NONE: 'none',
} as const;

type AiAnalysisStatus = typeof AI_ANALYSIS_STATUS[keyof typeof AI_ANALYSIS_STATUS];

/**
 * ファイルデータの型定義
 */
interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded
}

/**
 * インシデントデータの型定義
 */
interface IncidentData {
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
interface IncidentResult {
  success: boolean;
  message: string;
  incidentDate: string;
  record: IncidentRecord;
}

/**
 * インシデント一覧取得用の型定義
 */
interface IncidentRecord {
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
  aiAnalysisStatus?: AiAnalysisStatus;
  aiAnalysis?: string;
}
