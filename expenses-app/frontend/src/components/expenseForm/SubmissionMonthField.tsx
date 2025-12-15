import { ChangeEvent } from 'react';
import { fieldLabelClass, inputFieldClass } from '../../types/constants';
import { getSubmissionMonthOptions } from '../../utils/dateUtils';
import { FieldErrorTooltip } from '../ui';

interface SubmissionMonthFieldProps {
  /** 提出月の値 */
  value: string;
  /** 変更時のハンドラ */
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  /** バリデーションエラーメッセージ */
  error?: string;
}

/**
 * 提出月選択フィールドコンポーネント
 */
export default function SubmissionMonthField({
  value,
  onChange,
  error,
}: SubmissionMonthFieldProps) {
  return (
    <label
      htmlFor="submissionMonth"
      className={`flex flex-col gap-2 ${fieldLabelClass}`}
    >
      <span className="flex items-center gap-1">
        提出月 <span className="text-rose-500">*</span>
      </span>
      <select
        id="submissionMonth"
        name="submissionMonth"
        value={value}
        onChange={onChange}
        className={`${inputFieldClass} ${error ? 'border-rose-300' : ''}`}
      >
        {getSubmissionMonthOptions().map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldErrorTooltip message={error} />
    </label>
  );
}
