import { ChangeEvent } from 'react';
import { FormSection, FieldErrorTooltip } from '../ui';
import {
  fieldLabelClass,
  inputFieldClass,
  timeFieldClass,
  OFFICE_FREQUENCY_OPTIONS,
} from '../../types/constants';

interface WorkHoursSectionProps {
  /** 始業時間 */
  workStartTime: string;
  /** 終業時間 */
  workEndTime: string;
  /** 出社頻度 */
  officeFrequency: string;
  /** 変更時のハンドラ */
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  /** バリデーションエラー */
  errors?: {
    workStartTime?: string;
    workEndTime?: string;
    officeFrequency?: string;
  };
}

/**
 * 現場勤務状況セクションコンポーネント
 */
export default function WorkHoursSection({
  workStartTime,
  workEndTime,
  officeFrequency,
  onChange,
  errors,
}: WorkHoursSectionProps) {
  return (
    <FormSection title="現場勤務状況" required>
      <div className="grid gap-4 md:grid-cols-2">
        <label
          htmlFor="workStartTime"
          className={`flex flex-col gap-2 ${fieldLabelClass}`}
        >
          始業時間
          <input
            type="time"
            id="workStartTime"
            name="workStartTime"
            value={workStartTime}
            onChange={onChange}
            className={`${timeFieldClass} ${errors?.workStartTime ? 'border-rose-300' : ''}`}
          />
          <FieldErrorTooltip message={errors?.workStartTime} />
        </label>

        <label
          htmlFor="workEndTime"
          className={`flex flex-col gap-2 ${fieldLabelClass}`}
        >
          終業時間
          <input
            type="time"
            id="workEndTime"
            name="workEndTime"
            value={workEndTime}
            onChange={onChange}
            className={`${timeFieldClass} ${errors?.workEndTime ? 'border-rose-300' : ''}`}
          />
          <FieldErrorTooltip message={errors?.workEndTime} />
        </label>
      </div>

      <label
        htmlFor="officeFrequency"
        className={`flex flex-col gap-2 ${fieldLabelClass}`}
      >
        出社頻度
        <select
          id="officeFrequency"
          name="officeFrequency"
          value={officeFrequency}
          onChange={onChange}
          className={`${inputFieldClass} ${errors?.officeFrequency ? 'border-rose-300' : ''}`}
        >
          {OFFICE_FREQUENCY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldErrorTooltip message={errors?.officeFrequency} />
      </label>
    </FormSection>
  );
}
