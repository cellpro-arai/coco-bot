import { useMemo } from 'react';
import {
  CommuteSection,
  ExpenseSection,
  NameField,
  SubmissionMonthField,
  WorkHoursSection,
  CommuterPassSection,
  RemarksField,
  SubmitButton,
} from '../components/expenseForm';
import { Layout, Header } from '../components/layouts';
import {
  Card,
  SubmissionErrorModal,
  FileUploadField,
  FormSection,
} from '../components/ui';
import { getSubmissionMonthDateRange } from '../utils/dateUtils';
import { WORK_SCHEDULE_FILE_ACCEPT } from '../types/constants';
import { useExpenseFormState } from '../hooks/useExpenseFormState';

interface ExpenseFormPageProps {
  onSubmitSuccess: () => void;
}

/**
 * 経費精算フォームページ
 *
 * フォームの状態管理はuseExpenseFormStateフックに委譲し、
 * このコンポーネントは主にレイアウトとコンポーネントの組み立てを担当します。
 */
export default function ExpenseFormPage({
  onSubmitSuccess,
}: ExpenseFormPageProps) {
  const {
    formData,
    submitted,
    errorMessage,
    isErrorModalOpen,
    formRef,
    isNameEditable,
    isLoadingUserInfo,
    hasWorkHours,
    setHasWorkHours,
    hasCommute,
    setHasCommute,
    hasExpense,
    setHasExpense,
    commuteEntries,
    expenseEntries,
    handleInputChange,
    handleWorkScheduleFilesChange,
    removeWorkScheduleFile,
    handleSubmit,
    closeErrorModal,
  } = useExpenseFormState(onSubmitSuccess);

  const submissionMonthDateRange = useMemo(
    () => getSubmissionMonthDateRange(formData.submissionMonth),
    [formData.submissionMonth]
  );

  return (
    <Layout>
      <Header
        icon={<i className="bi bi-receipt" aria-hidden="true"></i>}
        title="経費精算フォーム"
        description="経費精算に必要な情報を入力してください"
      />

      <Card>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <NameField
              name={formData.name}
              onChange={handleInputChange}
              isEditable={isNameEditable}
              isLoading={isLoadingUserInfo}
            />

            <SubmissionMonthField
              value={formData.submissionMonth}
              onChange={handleInputChange}
            />
          </div>

          {/* 現場勤務状況 */}
          <WorkHoursSection
            workStartTime={formData.workStartTime}
            workEndTime={formData.workEndTime}
            officeFrequency={formData.officeFrequency}
            onChange={handleInputChange}
          />

          {/* 勤務表 */}
          <FormSection title="勤務表" required>
            <FileUploadField
              label="勤務表"
              files={formData.workScheduleFiles}
              onFilesChange={handleWorkScheduleFilesChange}
              onRemoveFile={removeWorkScheduleFile}
              accept={WORK_SCHEDULE_FILE_ACCEPT}
              multiple
              hasUpload={hasWorkHours}
              onHasUploadChange={setHasWorkHours}
            />
          </FormSection>

          {/* 定期券購入 */}
          <CommuterPassSection
            hasCommuterPass={formData.hasCommuterPass}
            nearestStation={formData.nearestStation}
            workStation={formData.workStation}
            monthlyFee={formData.monthlyFee}
            onChange={handleInputChange}
          />

          {/* 交通費 */}
          <CommuteSection
            entries={commuteEntries.entries}
            onChange={commuteEntries.handleChange}
            onAdd={commuteEntries.add}
            onRemove={commuteEntries.remove}
            onDuplicate={commuteEntries.duplicate}
            dateRange={submissionMonthDateRange}
            hasCommute={hasCommute}
            onHasCommuteChange={setHasCommute}
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
            hasExpense={hasExpense}
            onHasExpenseChange={setHasExpense}
          />

          {/* 備考 */}
          <RemarksField value={formData.remarks} onChange={handleInputChange} />

          {/* 送信ボタン */}
          <SubmitButton isSubmitting={submitted} />
        </form>
      </Card>

      {/* エラーモーダル */}
      <SubmissionErrorModal
        isOpen={isErrorModalOpen}
        message={errorMessage}
        onClose={closeErrorModal}
      />
    </Layout>
  );
}
