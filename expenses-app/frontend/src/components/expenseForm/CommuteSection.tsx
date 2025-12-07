import { CommuteEntry } from '../../types';
import type { SubmissionMonthDateRange } from '../../utils/dateUtils';
import { CommuteEntryCard } from '.';
import { FormSection } from '../ui';
import {
  helperTextClass,
  secondaryButtonClass,
} from '../../constants/formClasses';

interface CommuteSectionProps {
  entries: CommuteEntry[];
  onChange: (index: number, field: keyof CommuteEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  dateRange?: SubmissionMonthDateRange | null;
}

export default function CommuteSection({
  entries,
  onChange,
  onAdd,
  onRemove,
  onDuplicate,
  dateRange,
}: CommuteSectionProps) {
  // 入力行が存在するかどうかでガイダンスとカード一覧を出し分ける
  const hasEntries = entries.length > 0;

  return (
    <FormSection title="交通費">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onAdd}
          >
            + 交通費を追加
          </button>
        </div>
        {hasEntries && (
          <p className={helperTextClass}>
            日付・最寄り駅・訪問先駅・金額を入力してください。
          </p>
        )}
        {hasEntries ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:overflow-visible">
            <table className="min-w-[600px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">日付</th>
                  <th className="px-3 py-2">最寄り駅</th>
                  <th className="px-3 py-2">訪問先駅</th>
                  <th className="px-3 py-2">区分</th>
                  <th className="px-3 py-2">片道の金額</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <CommuteEntryCard
                    key={`commute-${index}`}
                    entry={entry}
                    index={index}
                    onChange={onChange}
                    onDuplicate={onDuplicate}
                    onRemove={onRemove}
                    dateRange={dateRange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            「+ 交通費を追加」を押すと入力欄が表示されます。
          </p>
        )}
      </div>
    </FormSection>
  );
}
