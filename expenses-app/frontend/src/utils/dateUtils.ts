import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  getDaysInMonth,
  parse,
  startOfMonth,
} from 'date-fns';

/**
 * デフォルトの提出月を取得します
 * 7日以前の場合は先月を返す
 */
export const getDefaultSubmissionMonth = (): string => {
  const today = new Date();
  const reference = today.getDate() <= 7 ? addMonths(today, -1) : today;
  return format(reference, 'yyyy-MM');
};

/**
 * 提出月の選択肢を生成します（前月、当月、翌月）
 */
export const getSubmissionMonthOptions = () => {
  const today = new Date();
  const options = [];

  for (let i = -1; i <= 1; i++) {
    const date = addMonths(today, i);
    options.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'yyyy年MM月'),
    });
  }

  return options;
};

export interface MonthDayOption {
  value: string;
  label: string;
}

export interface SubmissionMonthDateRange {
  min: string;
  max: string;
}

export const getMonthDayOptions = (submissionMonth: string): MonthDayOption[] => {
  if (!submissionMonth) return [];
  const baseDate = parse(`${submissionMonth}-01`, 'yyyy-MM-dd', new Date());
  if (isNaN(baseDate.getTime())) return [];

  const daysInMonth = getDaysInMonth(baseDate);

  return Array.from({ length: daysInMonth }, (_, idx) => {
    const dayDate = addDays(baseDate, idx);
    return {
      value: format(dayDate, 'yyyy-MM-dd'),
      label: format(dayDate, 'MM/dd'),
    };
  });
};

export const getSubmissionMonthDateRange = (
  submissionMonth: string
): SubmissionMonthDateRange | null => {
  if (!submissionMonth) return null;
  const baseDate = parse(`${submissionMonth}-01`, 'yyyy-MM-dd', new Date());
  if (isNaN(baseDate.getTime())) return null;

  const minDate = startOfMonth(baseDate);
  const maxDate = endOfMonth(baseDate);

  return {
    min: format(minDate, 'yyyy-MM-dd'),
    max: format(maxDate, 'yyyy-MM-dd'),
  };
};
