import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { FormData, CommuteEntry, ExpenseEntry } from '../types';
import { submitExpense } from '../services/apiService';
import { encodeFileToBase64 } from '../utils/fileUtils';
import {
  getDefaultSubmissionMonth,
  getSubmissionMonthOptions,
} from '../utils/dateUtils';
import {
  createEmptyCommuteEntry,
  createEmptyExpenseEntry,
} from '../utils/formUtils';
import {
  FileUploadField,
  CommuteEntryCard,
  ExpenseEntryCard,
  FormSection,
} from '../components';

const ERROR_MESSAGES = {
  COMMUTE_INCOMPLETE:
    '交通費の各項目（日時・最寄り駅・訪問先駅・金額）を入力してください。',
  EXPENSE_INCOMPLETE: '経費の日付、内容、金額を入力してください。',
  RECEIPT_REQUIRED: '経費には領収書の添付が必須です。',
  CERTIFICATE_REQUIRED: '資格受験の経費には合格通知書の添付が必須です。',
  RECEIPT_ENCODE_FAILED: '領収書の変換に失敗しました。',
  CERTIFICATE_ENCODE_FAILED: '合格通知書の変換に失敗しました。',
  SUBMISSION_FAILED: 'エラーが発生しました: ',
} as const;

const INITIAL_FORM_DATA: FormData = {
  name: '',
  submissionMonth: getDefaultSubmissionMonth(),
  workScheduleFiles: [],
  workStartTime: '09:00',
  workEndTime: '18:00',
  officeFrequency: 'fullRemote',
  hasCommuterPass: 'no',
  nearestStation: '',
  workStation: '',
  monthlyFee: '',
  remarks: '',
  commuteEntries: [],
  expenseEntries: [],
};

export default function MainPage() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const updateFormField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateFormField(name as keyof FormData, value);
  };

  const handleWorkScheduleFilesChange = (files: File[]) => {
    updateFormField('workScheduleFiles', [
      ...formData.workScheduleFiles,
      ...files,
    ]);
  };

  const removeWorkScheduleFile = (indexToRemove: number) => {
    updateFormField(
      'workScheduleFiles',
      formData.workScheduleFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const updateEntryArray = <T,>(
    arrayKey: 'commuteEntries' | 'expenseEntries',
    updater: (entries: T[]) => T[]
  ) => {
    setFormData(prev => ({
      ...prev,
      [arrayKey]: updater(prev[arrayKey] as T[]),
    }));
  };

  const handleCommuteEntryChange = (
    index: number,
    field: keyof CommuteEntry,
    value: string
  ) => {
    updateEntryArray<CommuteEntry>('commuteEntries', entries =>
      entries.map((entry, idx) =>
        idx === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const addCommuteEntry = () => {
    updateEntryArray<CommuteEntry>('commuteEntries', entries => [
      ...entries,
      createEmptyCommuteEntry(),
    ]);
  };

  const removeCommuteEntry = (index: number) => {
    updateEntryArray<CommuteEntry>('commuteEntries', entries =>
      entries.filter((_, idx) => idx !== index)
    );
  };

  const duplicateCommuteEntry = (index: number) => {
    updateEntryArray<CommuteEntry>('commuteEntries', entries => {
      const cloned = { ...entries[index], date: '' };
      const updated = [...entries];
      updated.splice(index + 1, 0, cloned);
      return updated;
    });
  };

  const handleExpenseEntryChange = (
    index: number,
    field: keyof ExpenseEntry,
    value: string
  ) => {
    updateEntryArray<ExpenseEntry>('expenseEntries', entries =>
      entries.map((entry, idx) => {
        if (idx !== index) return entry;
        const nextEntry = { ...entry, [field]: value };
        if (!nextEntry.description && !nextEntry.amount) {
          nextEntry.receiptFile = null;
          nextEntry.certificateFile = null;
        }
        if (field === 'category' && value !== 'certification') {
          nextEntry.certificateFile = null;
        }
        return nextEntry;
      })
    );
  };

  const handleExpenseReceiptChange = (index: number, file: File | null) => {
    updateEntryArray<ExpenseEntry>('expenseEntries', entries =>
      entries.map((entry, idx) =>
        idx === index ? { ...entry, receiptFile: file } : entry
      )
    );
  };

  const handleExpenseCertificateChange = (index: number, file: File | null) => {
    updateEntryArray<ExpenseEntry>('expenseEntries', entries =>
      entries.map((entry, idx) =>
        idx === index ? { ...entry, certificateFile: file } : entry
      )
    );
  };

  const addExpenseEntry = () => {
    updateEntryArray<ExpenseEntry>('expenseEntries', entries => [
      ...entries,
      createEmptyExpenseEntry(),
    ]);
  };

  const removeExpenseEntry = (index: number) => {
    updateEntryArray<ExpenseEntry>('expenseEntries', entries =>
      entries.filter((_, idx) => idx !== index)
    );
  };

  const collectCommuteEntries = () => {
    return formData.commuteEntries
      .filter(
        entry => entry.date || entry.origin || entry.destination || entry.amount
      )
      .map(entry => {
        if (
          !entry.date ||
          !entry.origin ||
          !entry.destination ||
          !entry.amount
        ) {
          throw new Error(ERROR_MESSAGES.COMMUTE_INCOMPLETE);
        }
        return { ...entry, tripType: entry.tripType || 'oneWay' };
      });
  };

  const validateExpenseEntry = (entry: ExpenseEntry) => {
    if (!entry.date || !entry.description || !entry.amount) {
      throw new Error(ERROR_MESSAGES.EXPENSE_INCOMPLETE);
    }
    if (!entry.receiptFile) {
      throw new Error(ERROR_MESSAGES.RECEIPT_REQUIRED);
    }
    const category = entry.category || 'other';
    if (category === 'certification' && !entry.certificateFile) {
      throw new Error(ERROR_MESSAGES.CERTIFICATE_REQUIRED);
    }
  };

  const encodeExpenseFiles = async (entry: ExpenseEntry) => {
    const receiptFileData = await encodeFileToBase64(entry.receiptFile!);
    if (!receiptFileData) {
      throw new Error(ERROR_MESSAGES.RECEIPT_ENCODE_FAILED);
    }

    const category = entry.category || 'other';
    let certificateFileData = null;
    if (category === 'certification' && entry.certificateFile) {
      certificateFileData = await encodeFileToBase64(entry.certificateFile);
      if (!certificateFileData) {
        throw new Error(ERROR_MESSAGES.CERTIFICATE_ENCODE_FAILED);
      }
    }

    return {
      date: entry.date,
      category,
      description: entry.description,
      amount: entry.amount,
      receiptFile: receiptFileData,
      certificateFile: certificateFileData,
    };
  };

  const collectExpenseEntries = async () => {
    const filledEntries = formData.expenseEntries.filter(
      entry => entry.date || entry.description || entry.amount
    );

    filledEntries.forEach(validateExpenseEntry);
    return Promise.all(filledEntries.map(encodeExpenseFiles));
  };

  const resetForm = () => {
    formRef.current?.reset();
    setFormData({
      ...INITIAL_FORM_DATA,
      submissionMonth: getDefaultSubmissionMonth(),
    });
    setSubmitted(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    try {
      // 勤務表ファイルをBase64エンコード
      const workScheduleFilesData = await Promise.all(
        formData.workScheduleFiles.map(file => encodeFileToBase64(file))
      );

      const commuteEntries = collectCommuteEntries();
      const expenseEntries = await collectExpenseEntries();

      // バックエンドに送信するデータを準備
      const expenseData = {
        name: formData.name,
        submissionMonth: formData.submissionMonth,
        workScheduleFiles: workScheduleFilesData,
        workStartTime: formData.workStartTime,
        workEndTime: formData.workEndTime,
        officeFrequency: formData.officeFrequency,
        hasCommuterPass: formData.hasCommuterPass,
        nearestStation: formData.nearestStation,
        workStation: formData.workStation,
        monthlyFee: formData.monthlyFee,
        remarks: formData.remarks,
        commuteEntries,
        expenseEntries,
      };

      // Google Apps Scriptのバックエンド関数を呼び出し
      try {
        const result = await submitExpense(expenseData);
        alert(result.message);
        resetForm();
      } catch (error: any) {
        alert(ERROR_MESSAGES.SUBMISSION_FAILED + error.message);
        setSubmitted(false);
      }
    } catch (error: any) {
      alert(ERROR_MESSAGES.SUBMISSION_FAILED + error.message);
      setSubmitted(false);
    }
  };

  const hasCommuteEntries = formData.commuteEntries.length > 0;
  const hasExpenseEntries = formData.expenseEntries.length > 0;

  return (
    <>
      <main className="container">
        {/* ヘッダー */}
        <article className="text-center py-3">
          <div className="d-flex align-items-center justify-content-center mb-2">
            <i
              className="bi bi-receipt me-2"
              style={{ fontSize: '2rem', color: 'var(--pico-primary)' }}
            ></i>
            <h1 className="mb-0">経費精算フォーム</h1>
          </div>
          <p className="mb-0">経費精算に必要な情報を入力してください</p>
        </article>

        {/* フォーム */}
        <article>
          <form ref={formRef} onSubmit={handleSubmit}>
            {/* 氏名 */}
            <legend className="required-label">氏名</legend>
            <label htmlFor="name">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="山田 太郎"
              />
            </label>

            {/* 提出月 */}
            <fieldset>
              <legend className="required-label">提出月</legend>
              <label htmlFor="submissionMonth">
                <select
                  id="submissionMonth"
                  name="submissionMonth"
                  value={formData.submissionMonth}
                  onChange={handleInputChange}
                  required
                >
                  {getSubmissionMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            {/* 勤務表 */}
            <FileUploadField
              label="勤務表"
              files={formData.workScheduleFiles}
              onFilesChange={handleWorkScheduleFilesChange}
              onRemoveFile={removeWorkScheduleFile}
              accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
              multiple
            />

            {/* 交通費 */}
            <FormSection title="交通費">
              <div className="commute-table-container">
                <div className="commute-table-header">
                  <button
                    type="button"
                    className="secondary"
                    onClick={addCommuteEntry}
                  >
                    + 交通費を追加
                  </button>
                </div>
                {hasCommuteEntries && (
                  <small>
                    日付・最寄り駅・訪問先駅・金額を入力してください。
                  </small>
                )}
                {hasCommuteEntries ? (
                  <div className="commute-cards-grid">
                    {formData.commuteEntries.map((entry, index) => (
                      <CommuteEntryCard
                        key={`commute-${index}`}
                        entry={entry}
                        index={index}
                        onChange={handleCommuteEntryChange}
                        onDuplicate={duplicateCommuteEntry}
                        onRemove={removeCommuteEntry}
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

            {/* 経費 */}
            <FormSection title="経費">
              <div className="expense-table-container">
                <div className="expense-table-header">
                  <button
                    type="button"
                    className="secondary"
                    onClick={addExpenseEntry}
                  >
                    + 経費を追加
                  </button>
                </div>
                {hasExpenseEntries && (
                  <small>
                    経費種別を選択し、日付、金額、内容を入力してください。資格受験は領収書に加え、合格通知書の添付が必須です。
                  </small>
                )}
                {hasExpenseEntries ? (
                  <div className="expense-cards-grid">
                    {formData.expenseEntries.map((entry, index) => (
                      <ExpenseEntryCard
                        key={`expense-${index}`}
                        entry={entry}
                        index={index}
                        onChange={handleExpenseEntryChange}
                        onReceiptChange={handleExpenseReceiptChange}
                        onCertificateChange={handleExpenseCertificateChange}
                        onRemove={removeExpenseEntry}
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

            {/* 現場勤務状況 */}
            <FormSection title="現場勤務状況" required>
              <div className="grid">
                <label htmlFor="workStartTime">
                  始業時間
                  <input
                    type="time"
                    id="workStartTime"
                    name="workStartTime"
                    value={formData.workStartTime}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label htmlFor="workEndTime">
                  就業時間
                  <input
                    type="time"
                    id="workEndTime"
                    name="workEndTime"
                    value={formData.workEndTime}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              {/* 出社頻度 */}
              <label htmlFor="officeFrequency">
                出社頻度
                <select
                  id="officeFrequency"
                  name="officeFrequency"
                  value={formData.officeFrequency}
                  onChange={handleInputChange}
                  required
                >
                  <option value="fullRemote">フルリモート</option>
                  <option value="weekly1to2">週1~2出社</option>
                  <option value="weekly3to5">週3~5出社</option>
                </select>
              </label>
            </FormSection>

            {/* 定期券購入 */}
            <FormSection title="定期券購入" required>
              <label>
                <input
                  type="radio"
                  name="hasCommuterPass"
                  value="yes"
                  checked={formData.hasCommuterPass === 'yes'}
                  onChange={handleInputChange}
                />
                有り
              </label>
              <label>
                <input
                  type="radio"
                  name="hasCommuterPass"
                  value="no"
                  checked={formData.hasCommuterPass === 'no'}
                  onChange={handleInputChange}
                />
                無し
              </label>
            </FormSection>

            {/* 定期券詳細（条件付き表示） */}
            {formData.hasCommuterPass === 'yes' && (
              <FormSection title="定期券詳細" required>
                <div className="grid">
                  <label htmlFor="nearestStation">
                    最寄り駅
                    <input
                      type="text"
                      id="nearestStation"
                      name="nearestStation"
                      value={formData.nearestStation}
                      onChange={handleInputChange}
                      required={formData.hasCommuterPass === 'yes'}
                      placeholder="例: 渋谷駅"
                    />
                  </label>

                  <label htmlFor="workStation">
                    勤務先の駅
                    <input
                      type="text"
                      id="workStation"
                      name="workStation"
                      value={formData.workStation}
                      onChange={handleInputChange}
                      required={formData.hasCommuterPass === 'yes'}
                      placeholder="例: 新宿駅"
                    />
                  </label>
                </div>

                <label htmlFor="monthlyFee">
                  月額（円）
                  <input
                    type="number"
                    id="monthlyFee"
                    name="monthlyFee"
                    value={formData.monthlyFee}
                    onChange={handleInputChange}
                    required={formData.hasCommuterPass === 'yes'}
                    min="0"
                    placeholder="例: 15000"
                  />
                </label>
              </FormSection>
            )}

            {/* 備考 */}
            <label htmlFor="remarks">
              備考
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={4}
                placeholder="その他連絡事項があればご記入ください"
              ></textarea>
            </label>

            {/* 送信ボタン */}
            <button type="submit" disabled={submitted}>
              {submitted ? '送信中...' : '提出する'}
            </button>
          </form>
        </article>
      </main>

      {/* フッター */}
      <footer className="container text-center">
        <p className="mb-0">
          <small>&copy; 2025 Demo Inc. All rights reserved.</small>
        </p>
      </footer>
    </>
  );
}
