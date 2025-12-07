// エラーメッセージなどUI全体で共有する定数
export const FORM_ERROR_MESSAGES = {
  SUBMISSION_FAILED: 'エラーが発生しました: ',
} as const;

export const COMMUTE_ERROR_MESSAGES = {
  COMMUTE_INCOMPLETE:
    '交通費の各項目（日時・最寄り駅・訪問先駅・金額）を入力してください。',
} as const;

export const EXPENSE_ERROR_MESSAGES = {
  EXPENSE_INCOMPLETE: '経費の日付、内容、金額を入力してください。',
  RECEIPT_REQUIRED: '経費には領収書の添付が必須です。',
  CERTIFICATE_REQUIRED: '資格受験の経費には合格通知書の添付が必須です。',
  RECEIPT_ENCODE_FAILED: '領収書の変換に失敗しました。',
  CERTIFICATE_ENCODE_FAILED: '合格通知書の変換に失敗しました。',
} as const;

/**
 * フォーム選択肢の定数定義
 */

/**
 * 出社頻度の選択肢
 */
export const OFFICE_FREQUENCY_OPTIONS = [
  { value: 'fullRemote', label: 'フルリモート' },
  { value: 'weekly1to2', label: '週1~2出社' },
  { value: 'weekly3to5', label: '週3~5出社' },
] as const;

/**
 * 勤務表ファイルの許可形式
 */
export const WORK_SCHEDULE_FILE_ACCEPT = '.pdf,.xlsx,.xls,.jpg,.jpeg,.png';

/**
 * デフォルトの勤務時間
 */
export const DEFAULT_WORK_HOURS = {
  startTime: '09:00',
  endTime: '18:00',
} as const;

/**
 * 有り/無しの選択肢（汎用）
 */
export const YES_NO_OPTIONS = [
  { value: 'yes', label: '有り' },
  { value: 'no', label: '無し' },
] as const;

export const sectionCardClass =
  'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm';

export const legendBaseClass = 'text-base font-semibold text-slate-900';

export const fieldLabelClass = 'text-sm font-semibold text-slate-800';

export const cardLabelClass =
  'text-xs font-semibold uppercase tracking-wide text-slate-500';

export const inputFieldClass =
  'mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60';

export const inputFieldCompactClass =
  'w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60';

export const dateFieldClass = `${inputFieldClass} appearance-auto`;
export const dateFieldCompactClass = `${inputFieldCompactClass} appearance-auto`;
export const timeFieldClass = `${inputFieldClass} appearance-auto`;

export const helperTextClass = 'text-xs text-slate-500';

export const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60';

export const destructiveButtonClass =
  'inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-60';
