import { ExpenseEntry } from '../types';
import type { SubmissionMonthDateRange } from '../utils/dateUtils';
import { ExpenseEntryCard, FormSection } from './';
import { helperTextClass, secondaryButtonClass } from './formClasses';

interface ExpenseSectionProps {
  entries: ExpenseEntry[];
  onChange: (index: number, field: keyof ExpenseEntry, value: string) => void;
  onReceiptChange: (index: number, file: File | null) => void;
  onCertificateChange: (index: number, file: File | null) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  dateRange?: SubmissionMonthDateRange | null;
}

export default function ExpenseSection({
  entries,
  onChange,
  onReceiptChange,
  onCertificateChange,
  onAdd,
  onRemove,
  dateRange,
}: ExpenseSectionProps) {
  // 既存の経費入力有無で説明文とグリッドの表示を切り替える
  const hasEntries = entries.length > 0;

  return (
    <FormSection title="経費">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onAdd}
          >
            + 経費を追加
          </button>
        </div>
        {hasEntries && (
          <p className={helperTextClass}>
            経費種別を選択し、日付、金額、内容を入力してください。資格受験は領収書に加え、合格通知書の添付が必須です。
          </p>
        )}
        {hasEntries ? (
          <div className="flex flex-col gap-4">
                {entries.map((entry, index) => (
                  <ExpenseEntryCard
                    key={`expense-${index}`}
                    entry={entry}
                    index={index}
                    onChange={onChange}
                    onReceiptChange={onReceiptChange}
                    onCertificateChange={onCertificateChange}
                    onRemove={onRemove}
                    dateRange={dateRange}
                  />
                ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            「+ 経費を追加」を押すと入力欄が表示されます。
          </p>
        )}
      </div>
    </FormSection>
  );
}
