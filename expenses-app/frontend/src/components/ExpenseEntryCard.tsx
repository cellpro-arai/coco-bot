import { ExpenseEntry } from '../types';

interface ExpenseEntryCardProps {
  entry: ExpenseEntry;
  index: number;
  onChange: (index: number, field: keyof ExpenseEntry, value: string) => void;
  onReceiptChange: (index: number, file: File | null) => void;
  onCertificateChange: (index: number, file: File | null) => void;
  onRemove: (index: number) => void;
}

export default function ExpenseEntryCard({
  entry,
  index,
  onChange,
  onReceiptChange,
  onCertificateChange,
  onRemove,
}: ExpenseEntryCardProps) {
  const category = entry.category || 'other';
  const isCertification = category === 'certification';

  return (
    <div className="expense-card">
      <div className="expense-card-row">
        <div className="expense-card-field">
          <label
            className="expense-card-label"
            htmlFor={`expense-category-${index}`}
          >
            経費種別
          </label>
          <select
            id={`expense-category-${index}`}
            value={entry.category}
            onChange={e => onChange(index, 'category', e.target.value)}
          >
            <option value="ebook">電子書籍</option>
            <option value="book">書籍</option>
            <option value="certification">資格受験</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div className="expense-card-field">
          <label
            className="expense-card-label"
            htmlFor={`expense-date-${index}`}
          >
            日付
          </label>
          <input
            type="date"
            id={`expense-date-${index}`}
            value={entry.date}
            onChange={e => onChange(index, 'date', e.target.value)}
          />
        </div>
      </div>

      <div className="expense-card-row">
        <div className="expense-card-field">
          <label
            className="expense-card-label"
            htmlFor={`expense-amount-${index}`}
          >
            金額（円）
          </label>
          <input
            type="number"
            id={`expense-amount-${index}`}
            value={entry.amount}
            onChange={e => onChange(index, 'amount', e.target.value)}
            placeholder="例: 3000"
            min="0"
          />
        </div>

        <div className="expense-card-field">
          <label
            className="expense-card-label"
            htmlFor={`expense-description-${index}`}
          >
            内容
          </label>
          <input
            type="text"
            id={`expense-description-${index}`}
            value={entry.description}
            onChange={e => onChange(index, 'description', e.target.value)}
            placeholder="例: TypeScript入門書"
          />
        </div>
      </div>

      <div
        className={isCertification ? 'expense-card-row' : 'expense-card-row-3'}
      >
        <div className="expense-card-field">
          <label
            className="expense-card-label"
            htmlFor={`expense-receipt-${index}`}
          >
            領収書
          </label>
          <input
            type="file"
            id={`expense-receipt-${index}`}
            onChange={e => onReceiptChange(index, e.target.files?.[0] || null)}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          {entry.receiptFile && (
            <span
              className="file-name"
              style={{
                fontSize: '0.7rem',
                marginTop: '0.2rem',
              }}
            >
              {entry.receiptFile.name}
            </span>
          )}
        </div>

        {isCertification && (
          <div className="expense-card-field">
            <label
              className="expense-card-label"
              htmlFor={`expense-certificate-${index}`}
            >
              合格通知書
            </label>
            <input
              type="file"
              id={`expense-certificate-${index}`}
              onChange={e =>
                onCertificateChange(index, e.target.files?.[0] || null)
              }
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {entry.certificateFile && (
              <span
                className="file-name"
                style={{
                  fontSize: '0.7rem',
                  marginTop: '0.2rem',
                }}
              >
                {entry.certificateFile.name}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="expense-card-actions">
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
