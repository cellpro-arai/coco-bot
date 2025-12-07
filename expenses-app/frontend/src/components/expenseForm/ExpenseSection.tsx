import { ExpenseEntry } from '../../types';
import type { SubmissionMonthDateRange } from '../../utils/dateUtils';
import { ExpenseEntryCard } from '.';
import { FormSection } from '../ui';
import {
  helperTextClass,
  secondaryButtonClass,
  YES_NO_OPTIONS,
} from '../../types/constants';

interface ExpenseSectionProps {
  entries: ExpenseEntry[];
  onChange: (index: number, field: keyof ExpenseEntry, value: string) => void;
  onReceiptChange: (index: number, file: File | null) => void;
  onCertificateChange: (index: number, file: File | null) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  dateRange?: SubmissionMonthDateRange | null;
  /** 経費の有無 */
  hasExpense?: 'yes' | 'no';
  /** 経費有無の変更ハンドラ */
  onHasExpenseChange?: (value: 'yes' | 'no') => void;
}

export default function ExpenseSection({
  entries,
  onChange,
  onReceiptChange,
  onCertificateChange,
  onAdd,
  onRemove,
  dateRange,
  hasExpense = 'no',
  onHasExpenseChange,
}: ExpenseSectionProps) {
  // 既存の経費入力有無で説明文とグリッドの表示を切り替える
  const hasEntries = entries.length > 0;

  return (
    <FormSection title="経費" required>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {onHasExpenseChange && (
            <div className="flex items-center gap-3">
              {YES_NO_OPTIONS.map(option => (
                <label key={option.value} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="has-expense"
                    value={option.value}
                    checked={hasExpense === option.value}
                    onChange={() => onHasExpenseChange(option.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>
          )}
          {hasExpense === 'yes' && (
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={onAdd}
            >
              + 経費を追加
            </button>
          )}
        </div>
        {hasExpense === 'yes' && (
          <>
            {hasEntries && (
              <p className={helperTextClass}>
                経費種別を選択し、日付、金額、内容を入力してください。資格受験は領収書に加え、合格通知書の添付が必須です。
              </p>
            )}
            {hasEntries && (
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
            )}
          </>
        )}
      </div>
    </FormSection>
  );
}
