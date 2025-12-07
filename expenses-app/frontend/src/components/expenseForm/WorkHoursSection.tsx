import { ChangeEvent } from 'react';
import { FormSection } from '../ui';
import {
  fieldLabelClass,
  inputFieldClass,
  timeFieldClass,
} from '../../constants/formClasses';
import { OFFICE_FREQUENCY_OPTIONS } from '../../constants/formOptions';

interface WorkHoursSectionProps {
  /** 始業時間 */
  workStartTime: string;
  /** 終業時間 */
  workEndTime: string;
  /** 出社頻度 */
  officeFrequency: string;
  /** 変更時のハンドラ */
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

/**
 * 現場勤務状況セクションコンポーネント
 */
export default function WorkHoursSection({
  workStartTime,
  workEndTime,
  officeFrequency,
  onChange,
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
            required
            className={timeFieldClass}
          />
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
            required
            className={timeFieldClass}
          />
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
          required
          className={inputFieldClass}
        >
          {OFFICE_FREQUENCY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </FormSection>
  );
}
