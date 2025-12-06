import { useState, useRef, FormEvent, ChangeEvent, useMemo } from 'react';
import type { FormData } from '../types';
import { submitExpense } from '../services/apiService';
import { encodeFileToBase64 } from '../utils/fileUtils';
import {
  getDefaultSubmissionMonth,
  getSubmissionMonthOptions,
  getSubmissionMonthDateRange,
} from '../utils/dateUtils';
import {
  FileUploadField,
  CommuteSection,
  ExpenseSection,
  FormSection,
} from '../components';
import {
  fieldLabelClass,
  inputFieldClass,
  timeFieldClass,
} from '../components/formClasses';
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
  const submissionMonthDateRange = useMemo(
    () => getSubmissionMonthDateRange(formData.submissionMonth),
    [formData.submissionMonth]
  );

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        {/* ヘッダー */}
        <article className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:text-left">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-3xl text-indigo-600">
              <i className="bi bi-receipt" aria-hidden="true"></i>
            </span>
            <div className="sm:text-left">
              <h1 className="text-2xl font-semibold text-slate-900">
                経費精算フォーム
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                経費精算に必要な情報を入力してください
              </p>
            </div>
          </div>
        </article>

        {/* フォーム */}
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label
                htmlFor="name"
                className={`flex flex-col gap-2 ${fieldLabelClass}`}
              >
                <span className="flex items-center gap-1">
                  氏名 <span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="山田 太郎"
                  className={inputFieldClass}
                />
              </label>

              <label
                htmlFor="submissionMonth"
                className={`flex flex-col gap-2 ${fieldLabelClass}`}
              >
                <span className="flex items-center gap-1">
                  提出月 <span className="text-rose-500">*</span>
                </span>
                <select
                  id="submissionMonth"
                  name="submissionMonth"
                  value={formData.submissionMonth}
                  onChange={handleInputChange}
                  required
                  className={inputFieldClass}
                >
                  {getSubmissionMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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
              dateRange={submissionMonthDateRange}
            />

            {/* 経費 */}
            <ExpenseSection
              entries={expenseEntries.entries}
              onChange={expenseEntries.handleChange}
              onReceiptChange={expenseEntries.handleReceiptChange}
              onCertificateChange={expenseEntries.handleCertificateChange}
              onAdd={expenseEntries.add}
              onRemove={expenseEntries.remove}
              dateRange={submissionMonthDateRange}
            />

            {/* 現場勤務状況 */}
            <FormSection title="現場勤務状況" required>
              <div className="grid gap-4 md:grid-cols-2">
                <label
                  htmlFor="workStartTime"
                  className={`flex flex-col gap-2 ${fieldLabelClass}`}
                >
                  始業時間
                  <input
                    type="time"
                    id="workStartTime"
                    name="workStartTime"
                    value={formData.workStartTime}
                    onChange={handleInputChange}
                    required
                    className={timeFieldClass}
                  />
                </label>

                <label
                  htmlFor="workEndTime"
                  className={`flex flex-col gap-2 ${fieldLabelClass}`}
                >
                  就業時間
                  <input
                    type="time"
                    id="workEndTime"
                    name="workEndTime"
                    value={formData.workEndTime}
                    onChange={handleInputChange}
                    required
                    className={timeFieldClass}
                  />
                </label>
              </div>

              {/* 出社頻度 */}
              <label
                htmlFor="officeFrequency"
                className={`flex flex-col gap-2 ${fieldLabelClass}`}
              >
                出社頻度
                <select
                  id="officeFrequency"
                  name="officeFrequency"
                  value={formData.officeFrequency}
                  onChange={handleInputChange}
                  required
                  className={inputFieldClass}
                >
                  <option value="fullRemote">フルリモート</option>
                  <option value="weekly1to2">週1~2出社</option>
                  <option value="weekly3to5">週3~5出社</option>
                </select>
              </label>
            </FormSection>

            {/* 定期券購入 */}
            <FormSection title="定期券購入" required>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="hasCommuterPass"
                    value="yes"
                    checked={formData.hasCommuterPass === 'yes'}
                    onChange={handleInputChange}
                    className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  有り
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="hasCommuterPass"
                    value="no"
                    checked={formData.hasCommuterPass === 'no'}
                    onChange={handleInputChange}
                    className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  無し
                </label>
              </div>
            </FormSection>

            {/* 定期券詳細（条件付き表示） */}
            {formData.hasCommuterPass === 'yes' && (
              <FormSection title="定期券詳細" required>
                <div className="grid gap-4 md:grid-cols-2">
                  <label
                    htmlFor="nearestStation"
                    className={`flex flex-col gap-2 ${fieldLabelClass}`}
                  >
                    最寄り駅
                    <input
                      type="text"
                      id="nearestStation"
                      name="nearestStation"
                      value={formData.nearestStation}
                      onChange={handleInputChange}
                      required
                      placeholder="例: 渋谷駅"
                      className={inputFieldClass}
                    />
                  </label>

                  <label
                    htmlFor="workStation"
                    className={`flex flex-col gap-2 ${fieldLabelClass}`}
                  >
                    勤務先の駅
                    <input
                      type="text"
                      id="workStation"
                      name="workStation"
                      value={formData.workStation}
                      onChange={handleInputChange}
                      required
                      placeholder="例: 新宿駅"
                      className={inputFieldClass}
                    />
                  </label>
                </div>

                <label
                  htmlFor="monthlyFee"
                  className={`flex flex-col gap-2 ${fieldLabelClass}`}
                >
                  月額（円）
                  <input
                    type="number"
                    id="monthlyFee"
                    name="monthlyFee"
                    value={formData.monthlyFee}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="例: 15000"
                    className={inputFieldClass}
                  />
                </label>
              </FormSection>
            )}

            {/* 備考 */}
            <label
              htmlFor="remarks"
              className={`flex flex-col gap-2 ${fieldLabelClass}`}
            >
              備考
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={4}
                placeholder="その他連絡事項があればご記入ください"
                className={`${inputFieldClass} min-h-[8rem]`}
              ></textarea>
            </label>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={submitted}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitted ? '送信中...' : '提出する'}
            </button>
          </form>
        </article>
      </main>

      {/* フッター */}
      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-sm text-slate-500">
        <p>&copy; 2025 Demo Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
