import { CommuteEntry } from '../types';
import { CommuteEntryCard, FormSection } from './';

interface CommuteSectionProps {
  entries: CommuteEntry[];
  onChange: (index: number, field: keyof CommuteEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
}

export default function CommuteSection({
  entries,
  onChange,
  onAdd,
  onRemove,
  onDuplicate,
}: CommuteSectionProps) {
  const hasEntries = entries.length > 0;

  return (
    <FormSection title="交通費">
      <div className="commute-table-container">
        <div className="commute-table-header">
          <button type="button" className="secondary" onClick={onAdd}>
            + 交通費を追加
          </button>
        </div>
        {hasEntries && (
          <small>日付・最寄り駅・訪問先駅・金額を入力してください。</small>
        )}
        {hasEntries ? (
          <div className="commute-cards-grid">
            {entries.map((entry, index) => (
              <CommuteEntryCard
                key={`commute-${index}`}
                entry={entry}
                index={index}
                onChange={onChange}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted">
            「+ 交通費を追加」を押すと入力欄が表示されます。
          </p>
        )}
      </div>
    </FormSection>
  );
}
