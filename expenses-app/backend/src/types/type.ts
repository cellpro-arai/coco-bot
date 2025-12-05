// ファイルデータ
export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded
}

// 出社の頻度
export type OfficeFrequency = 'fullRemote' | 'weekly1to2' | 'weekly3to5';

// フォルダのスクリプトプロパティキー
export type FolderPropertyKey =
  | 'WORK_SCHEDULE_FOLDER_ID'
  | 'EXPENSE_REPORT_FOLDER_ID'
  | 'RECEIPT_FOLDER_ID';

// 交通費明細データ
export interface CommuteEntry {
  date: string;
  origin: string;
  destination: string;
  amount: string;
  tripType?: 'oneWay' | 'roundTrip';
}

// 経費のカテゴリ
export type ExpenseCategory =
  | 'ebook'
  | 'udemy'
  | 'seminar'
  | 'certification'
  | 'other';

// 経費明細データ
export interface ExpenseEntry {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: string;
  receiptFile: FileData | null;
  certificateFile?: FileData | null;
}

// 経費明細データ
export interface ExpenseEntryRecord {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: string;
  receiptUrl: string;
  certificateUrl?: string;
}

// フォームの送信データ
export interface ExpenseData {
  name: string;
  submissionMonth: string;
  workScheduleFiles: FileData[];
  commuteEntries: CommuteEntry[];
  expenseEntries: ExpenseEntry[];
  workStartTime: string;
  workEndTime: string;
  officeFrequency: OfficeFrequency;
  hasCommuterPass: 'yes' | 'no';
  nearestStation: string;
  workStation: string;
  monthlyFee: string;
  remarks: string;
}

// 経費精算登録結果のレスポンス
export interface ExpenseResult {
  success: boolean;
  message: string;
  submittedDate: string;
}

export const EXPENSE_MANAGEMENT_SHEET_NAME = '経費精算';
export const EXPENSE_SHEET_HEADERS = [
  '提出日時',
  '提出者',
  '氏名',
  '提出月',
  '勤務表',
  '経費精算書',
  '領収書',
  '開始時間',
  '終了時間',
  '出社頻度',
  '定期券購入',
  '定期区間',
  '定期券金額',
  '備考',
];
export const EXPENSE_REPORT_SHEET_NAME = '経費精算書';

export const COLOR_PRIMARY = '#0070C0';
export const COLOR_WHITE = 'white';
export const BORDER_SOLID = SpreadsheetApp.BorderStyle.SOLID;
export const BORDER_MEDIUM = SpreadsheetApp.BorderStyle.SOLID_MEDIUM;
