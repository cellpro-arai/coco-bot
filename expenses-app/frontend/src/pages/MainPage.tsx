import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import type { FormData } from '../types';
import { submitExpense } from '../services/apiService';
import { encodeFileToBase64 } from '../utils/fileUtils';
import {
  getDefaultSubmissionMonth,
  getSubmissionMonthOptions,
} from '../utils/dateUtils';
import {
  FileUploadField,
  CommuteSection,
  ExpenseSection,
  FormSection,
} from '../components';
import { useCommuteEntries } from '../hooks/useCommuteEntries';
import { useExpenseEntries } from '../hooks/useExpenseEntries';

const ERROR_MESSAGES = {
  SUBMISSION_FAILED: 'エラーが発生しました: ',
} as const;

const INITIAL_FORM_DATA: Omit<FormData, 'commuteEntries' | 'expenseEntries'> = {
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
};

export default function MainPage() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const commuteEntries = useCommuteEntries();
  const expenseEntries = useExpenseEntries();

  const updateFormField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateFormField(name as keyof typeof formData, value);
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

  const resetForm = () => {
    formRef.current?.reset();
    setFormData({
      ...INITIAL_FORM_DATA,
      submissionMonth: getDefaultSubmissionMonth(),
    });
    commuteEntries.reset();
    expenseEntries.reset();
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

      const commuteEntriesData = commuteEntries.collectEntries();
      const expenseEntriesData = await expenseEntries.collectEntries();

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
        commuteEntries: commuteEntriesData,
        expenseEntries: expenseEntriesData,
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
            <CommuteSection
              entries={commuteEntries.entries}
              onChange={commuteEntries.handleChange}
              onAdd={commuteEntries.add}
              onRemove={commuteEntries.remove}
              onDuplicate={commuteEntries.duplicate}
            />

            {/* 経費 */}
            <ExpenseSection
              entries={expenseEntries.entries}
              onChange={expenseEntries.handleChange}
              onReceiptChange={expenseEntries.handleReceiptChange}
              onCertificateChange={expenseEntries.handleCertificateChange}
              onAdd={expenseEntries.add}
              onRemove={expenseEntries.remove}
            />

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
