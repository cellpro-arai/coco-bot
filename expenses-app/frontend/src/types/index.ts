export interface CommuteEntry {
  date: string;
  origin: string;
  destination: string;
  amount: string;
  tripType: string;
}

export interface ExpenseEntry {
  date: string;
  category: string;
  description: string;
  amount: string;
  receiptFile: File | null;
  certificateFile: File | null;
}

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

export interface FileData {
  name: string;
  mimeType: string;
  data: string;
}

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

export interface ExpenseResult {
  success: boolean;
  message: string;
}
