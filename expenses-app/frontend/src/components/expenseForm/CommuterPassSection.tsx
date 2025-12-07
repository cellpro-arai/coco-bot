import { ChangeEvent } from 'react';
import { FormSection } from '../ui';
import { fieldLabelClass, inputFieldClass } from '../../constants/formClasses';
import { COMMUTER_PASS_OPTIONS } from '../../constants/formOptions';

interface CommuterPassSectionProps {
  /** 定期券購入 */
  hasCommuterPass: string;
  /** 最寄り駅 */
  nearestStation: string;
  /** 勤務先の駅 */
  workStation: string;
  /** 月額 */
  monthlyFee: string;
  /** 変更時のハンドラ */
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

/**
 * 定期券購入セクションコンポーネント
 */
export default function CommuterPassSection({
  hasCommuterPass,
  nearestStation,
  workStation,
  monthlyFee,
  onChange,
}: CommuterPassSectionProps) {
  return (
    <>
      <FormSection title="定期券購入" required>
        <div className="flex flex-wrap gap-4">
          {COMMUTER_PASS_OPTIONS.map(option => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <input
                type="radio"
                name="hasCommuterPass"
                value={option.value}
                checked={hasCommuterPass === option.value}
                onChange={onChange}
                className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {option.label}
            </label>
          ))}
        </div>
      </FormSection>

      {hasCommuterPass === 'yes' && (
        <FormSection title="定期券詳細" required>
          <div className="grid gap-4 md:grid-cols-2">
            <label
              htmlFor="nearestStation"
              className={`flex flex-col gap-2 ${fieldLabelClass}`}
            >
              最寄り駅
              <input
                type="text"
                id="nearestStation"
                name="nearestStation"
                value={nearestStation}
                onChange={onChange}
                required
                placeholder="例: 渋谷駅"
                className={inputFieldClass}
              />
            </label>

            <label
              htmlFor="workStation"
              className={`flex flex-col gap-2 ${fieldLabelClass}`}
            >
              勤務先の駅
              <input
                type="text"
                id="workStation"
                name="workStation"
                value={workStation}
                onChange={onChange}
                required
                placeholder="例: 新宿駅"
                className={inputFieldClass}
              />
            </label>
          </div>

          <label
            htmlFor="monthlyFee"
            className={`flex flex-col gap-2 ${fieldLabelClass}`}
          >
            月額（円）
            <input
              type="number"
              id="monthlyFee"
              name="monthlyFee"
              value={monthlyFee}
              onChange={onChange}
              required
              min="0"
              placeholder="例: 15000"
              className={inputFieldClass}
            />
          </label>
        </FormSection>
      )}
    </>
  );
}
