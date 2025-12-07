/**
 * 交通費入力フォーム1行分のデータ
 */
export interface CommuteEntry {
  date: string;
  origin: string;
  destination: string;
  amount: string;
  tripType: string;
}

/**
 * 経費入力フォーム1行分のデータ
 */
export interface ExpenseEntry {
  date: string;
  category: string;
  description: string;
  amount: string;
  receiptFile: File | null;
  certificateFile: File | null;
}

/**
 * 送信フォーム全体の状態
 */
export interface FormData {
  name: string;
  submissionMonth: string;
  workScheduleFiles: File[];
  workStartTime: string;
  workEndTime: string;
  officeFrequency: string;
  hasCommuterPass: string;
  nearestStation: string;
  workStation: string;
  monthlyFee: string;
  remarks: string;
  commuteEntries: CommuteEntry[];
  expenseEntries: ExpenseEntry[];
}

/**
 * App Script に送るファイルのメタデータ
 */
export interface FileData {
  name: string;
  mimeType: string;
  data: string;
}

/**
 * API 送信用に整形したフォームデータ
 */
export interface ExpenseSubmitData {
  name: string;
  submissionMonth: string;
  workScheduleFiles: (FileData | null)[];
  workStartTime: string;
  workEndTime: string;
  officeFrequency: string;
  hasCommuterPass: string;
  nearestStation: string;
  workStation: string;
  monthlyFee: string;
  remarks: string;
  commuteEntries: CommuteEntry[];
  expenseEntries: Array<{
    date: string;
    category: string;
    description: string;
    amount: string;
    receiptFile: FileData | null;
    certificateFile: FileData | null;
  }>;
}

/**
 * 経費送信 API の結果
 */
export interface ExpenseResult {
  success: boolean;
  message: string;
}

/**
 * 従業員情報
 */
export interface EmployeeInfo {
  employeeId: string;
  name: string;
  email: string;
  isActive: boolean;
}
