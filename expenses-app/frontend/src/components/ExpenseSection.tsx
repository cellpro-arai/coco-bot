import { ExpenseEntry } from '../types';
import { ExpenseEntryCard, FormSection } from './';

interface ExpenseSectionProps {
  entries: ExpenseEntry[];
  onChange: (index: number, field: keyof ExpenseEntry, value: string) => void;
  onReceiptChange: (index: number, file: File | null) => void;
  onCertificateChange: (index: number, file: File | null) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function ExpenseSection({
  entries,
  onChange,
  onReceiptChange,
  onCertificateChange,
  onAdd,
  onRemove,
}: ExpenseSectionProps) {
  const hasEntries = entries.length > 0;

  return (
    <FormSection title="経費">
      <div className="expense-table-container">
        <div className="expense-table-header">
          <button type="button" className="secondary" onClick={onAdd}>
            + 経費を追加
          </button>
        </div>
        {hasEntries && (
          <small>
            経費種別を選択し、日付、金額、内容を入力してください。資格受験は領収書に加え、合格通知書の添付が必須です。
          </small>
        )}
        {hasEntries ? (
          <div className="expense-cards-grid">
            {entries.map((entry, index) => (
              <ExpenseEntryCard
                key={`expense-${index}`}
                entry={entry}
                index={index}
                onChange={onChange}
                onReceiptChange={onReceiptChange}
                onCertificateChange={onCertificateChange}
                onRemove={onRemove}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted">
            「+ 経費を追加」を押すと入力欄が表示されます。
          </p>
        )}
      </div>
    </FormSection>
  );
}
