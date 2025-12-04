import { CommuteEntry } from '../types';

interface CommuteEntryCardProps {
  entry: CommuteEntry;
  index: number;
  onChange: (index: number, field: keyof CommuteEntry, value: string) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
}

export default function CommuteEntryCard({
  entry,
  index,
  onChange,
  onDuplicate,
  onRemove,
}: CommuteEntryCardProps) {
  return (
    <div className="commute-card">
      <div className="commute-card-field">
        <label className="commute-card-label" htmlFor={`commute-date-${index}`}>
          日付
        </label>
        <input
          type="date"
          id={`commute-date-${index}`}
          value={entry.date}
          onChange={e => onChange(index, 'date', e.target.value)}
        />
      </div>

      <div className="commute-card-field">
        <label
          className="commute-card-label"
          htmlFor={`commute-origin-${index}`}
        >
          最寄り駅
        </label>
        <input
          type="text"
          id={`commute-origin-${index}`}
          value={entry.origin}
          onChange={e => onChange(index, 'origin', e.target.value)}
          placeholder="例: 渋谷駅"
        />
      </div>

      <div className="commute-card-field">
        <label
          className="commute-card-label"
          htmlFor={`commute-destination-${index}`}
        >
          訪問先駅
        </label>
        <input
          type="text"
          id={`commute-destination-${index}`}
          value={entry.destination}
          onChange={e => onChange(index, 'destination', e.target.value)}
          placeholder="例: 新宿駅"
        />
      </div>

      <div className="commute-card-field">
        <label
          className="commute-card-label"
          htmlFor={`commute-tripType-${index}`}
        >
          区分
        </label>
        <select
          id={`commute-tripType-${index}`}
          value={entry.tripType}
          onChange={e => onChange(index, 'tripType', e.target.value)}
        >
          <option value="oneWay">片道</option>
          <option value="roundTrip">往復</option>
        </select>
      </div>

      <div className="commute-card-field">
        <label
          className="commute-card-label"
          htmlFor={`commute-amount-${index}`}
        >
          片道の金額
        </label>
        <input
          type="number"
          id={`commute-amount-${index}`}
          value={entry.amount}
          onChange={e => onChange(index, 'amount', e.target.value)}
          placeholder="例: 200"
          min="0"
        />
      </div>

      <div className="commute-card-actions">
        <button
          type="button"
          className="secondary"
          onClick={() => onDuplicate(index)}
        >
          複製
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => onRemove(index)}
        >
          削除
        </button>
      </div>
    </div>
  );
}
