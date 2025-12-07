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
 * 定期券購入の選択肢
 */
export const COMMUTER_PASS_OPTIONS = [
  { value: 'yes', label: '有り' },
  { value: 'no', label: '無し' },
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
