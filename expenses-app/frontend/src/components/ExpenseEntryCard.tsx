import { ExpenseEntry } from '../types';
import type { SubmissionMonthDateRange } from '../utils/dateUtils';
import {
  cardLabelClass,
  dateFieldClass,
  destructiveButtonClass,
  inputFieldClass,
} from './formClasses';

interface ExpenseEntryCardProps {
  entry: ExpenseEntry;
  index: number;
  onChange: (index: number, field: keyof ExpenseEntry, value: string) => void;
  onReceiptChange: (index: number, file: File | null) => void;
  onCertificateChange: (index: number, file: File | null) => void;
  onRemove: (index: number) => void;
  dateRange?: SubmissionMonthDateRange | null;
}

export default function ExpenseEntryCard({
  entry,
  index,
  onChange,
  onReceiptChange,
  onCertificateChange,
  onRemove,
  dateRange,
}: ExpenseEntryCardProps) {
  const category = entry.category || 'other';
  // 資格受験のみ合格通知書を必須にするための表示フラグ
  const isCertification = category === 'certification';
  const twoColumnRowClass = 'grid gap-4 md:grid-cols-2';

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={twoColumnRowClass}>
        <div className="flex flex-col gap-1">
          <label
            className={cardLabelClass}
            htmlFor={`expense-category-${index}`}
          >
            経費種別
          </label>
          <select
            id={`expense-category-${index}`}
            value={entry.category}
            onChange={e => onChange(index, 'category', e.target.value)}
            className={inputFieldClass}
          >
            <option value="ebook">電子書籍</option>
            <option value="book">書籍</option>
            <option value="certification">資格受験</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={cardLabelClass} htmlFor={`expense-date-${index}`}>
            日付
          </label>
          <input
            type="date"
            id={`expense-date-${index}`}
            value={entry.date}
            onChange={e => onChange(index, 'date', e.target.value)}
            max={dateRange?.max}
            className={dateFieldClass}
          />
        </div>
      </div>

      <div className={twoColumnRowClass}>
        <div className="flex flex-col gap-1">
          <label className={cardLabelClass} htmlFor={`expense-amount-${index}`}>
            金額（円）
          </label>
          <input
            type="number"
            id={`expense-amount-${index}`}
            value={entry.amount}
            onChange={e => onChange(index, 'amount', e.target.value)}
            placeholder="例: 3000"
            min="0"
            className={inputFieldClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            className={cardLabelClass}
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
            className={inputFieldClass}
          />
        </div>
      </div>

      <div className={twoColumnRowClass}>
        <div className="flex flex-col gap-1">
          <label className={cardLabelClass}>領収書</label>
          <div>
            <input
              type="file"
              id={`expense-receipt-${index}`}
              onChange={e =>
                onReceiptChange(index, e.target.files?.[0] || null)
              }
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            <label
              htmlFor={`expense-receipt-${index}`}
              className={`${inputFieldClass} cursor-pointer inline-block text-center`}
            >
              ファイルを選択
            </label>
            {entry.receiptFile && (
              <div className="mt-1 text-xs text-slate-500">
                {entry.receiptFile.name}
              </div>
            )}
          </div>
        </div>

        {isCertification && (
          // 合格通知書のアップロード欄は資格受験のときだけ描画する
          <div className="flex flex-col gap-1">
            <label className={cardLabelClass}>合格通知書</label>
            <div>
              <input
                type="file"
                id={`expense-certificate-${index}`}
                onChange={e =>
                  onCertificateChange(index, e.target.files?.[0] || null)
                }
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <label
                htmlFor={`expense-certificate-${index}`}
                className={`${inputFieldClass} cursor-pointer inline-block text-center`}
              >
                ファイルを選択
              </label>
              {entry.certificateFile && (
                <div className="mt-1 text-xs text-slate-500">
                  {entry.certificateFile.name}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          className={destructiveButtonClass}
          onClick={() => onRemove(index)}
        >
          削除
        </button>
      </div>
    </div>
  );
}
