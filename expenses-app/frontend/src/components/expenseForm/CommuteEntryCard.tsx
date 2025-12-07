import { CommuteEntry } from '../../types';
import type { SubmissionMonthDateRange } from '../../utils/dateUtils';
import {
  dateFieldCompactClass,
  destructiveButtonClass,
  inputFieldCompactClass,
  secondaryButtonClass,
} from '../../constants/formClasses';

interface CommuteEntryCardProps {
  entry: CommuteEntry;
  index: number;
  onChange: (index: number, field: keyof CommuteEntry, value: string) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  dateRange?: SubmissionMonthDateRange | null;
}

export default function CommuteEntryCard({
  entry,
  index,
  onChange,
  onDuplicate,
  onRemove,
  dateRange,
}: CommuteEntryCardProps) {
  return (
    <tr className="border-b border-slate-100 bg-white text-sm last:border-b-0">
      <td className="px-1 py-1 align-top">
        <input
          type="date"
          id={`commute-date-${index}`}
          value={entry.date}
          onChange={e => onChange(index, 'date', e.target.value)}
          min={dateRange?.min}
          max={dateRange?.max}
          className={`${dateFieldCompactClass} min-w-24`}
          aria-label="日付"
        />
      </td>
      <td className="px-1 py-1 align-top">
        <input
          type="text"
          id={`commute-origin-${index}`}
          value={entry.origin}
          onChange={e => onChange(index, 'origin', e.target.value)}
          placeholder="例: 渋谷駅"
          className={`${inputFieldCompactClass}`}
          aria-label="最寄り駅"
        />
      </td>
      <td className="px-1 py-1 align-top">
        <input
          type="text"
          id={`commute-destination-${index}`}
          value={entry.destination}
          onChange={e => onChange(index, 'destination', e.target.value)}
          placeholder="例: 新宿駅"
          className={`${inputFieldCompactClass}`}
          aria-label="訪問先駅"
        />
      </td>
      <td className="px-1 py-1 align-top">
        <div className="min-w-16">
          <select
            id={`commute-tripType-${index}`}
            value={entry.tripType}
            onChange={e => onChange(index, 'tripType', e.target.value)}
            className={`${inputFieldCompactClass} h-[30px]`}
            aria-label="区分"
          >
            <option value="oneWay">片道</option>
            <option value="roundTrip">往復</option>
          </select>
        </div>
      </td>
      <td className="px-1 py-1 align-top">
        <div className="w-22">
          <input
            type="number"
            id={`commute-amount-${index}`}
            value={entry.amount}
            onChange={e => onChange(index, 'amount', e.target.value)}
            placeholder="例: 200"
            min="0"
            className={`${inputFieldCompactClass}`}
            aria-label="片道の金額"
          />
        </div>
      </td>
      <td className="px-1 py-1 align-top whitespace-nowrap">
        {/* 頻出経路は複製ボタンで再入力を省略できる */}
        <div className="flex flex-row flex-nowrap gap-1">
          <button
            type="button"
            className={`${secondaryButtonClass} px-2 py-1 text-xs`}
            onClick={() => onDuplicate(index)}
          >
            複製
          </button>
          <button
            type="button"
            className={`${destructiveButtonClass} px-2 py-1 text-xs`}
            onClick={() => onRemove(index)}
          >
            削除
          </button>
        </div>
      </td>
    </tr>
  );
}
