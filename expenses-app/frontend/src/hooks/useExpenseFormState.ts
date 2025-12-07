import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { submitExpense } from '../services/apiService';
import { encodeFileToBase64 } from '../utils/fileUtils';
import { getDefaultSubmissionMonth } from '../utils/dateUtils';
import { FORM_ERROR_MESSAGES } from '../types/constants';
import { DEFAULT_WORK_HOURS } from '../constants/formOptions';
import { useCommuteEntries } from './useCommuteEntries';
import { useExpenseEntries } from './useExpenseEntries';
import { useUserInfo } from './useUserInfo';
import type { FormData } from '../types';

const INITIAL_FORM_DATA: Omit<FormData, 'commuteEntries' | 'expenseEntries'> = {
  name: '',
  submissionMonth: getDefaultSubmissionMonth(),
  workScheduleFiles: [],
  workStartTime: DEFAULT_WORK_HOURS.startTime,
  workEndTime: DEFAULT_WORK_HOURS.endTime,
  officeFrequency: 'fullRemote',
  hasCommuterPass: 'no',
  nearestStation: '',
  workStation: '',
  monthlyFee: '',
  remarks: '',
};

/**
 * 経費精算フォームの状態管理フック
 *
 * フォームの状態、ハンドラ、送信処理をまとめて提供します。
 */
export function useExpenseFormState(onSubmitSuccess: () => void) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const commuteEntries = useCommuteEntries();
  const expenseEntries = useExpenseEntries();
  const { userName, isNameEditable, isLoadingUserInfo } = useUserInfo();

  // ユーザー情報が取得できたら氏名を設定
  useEffect(() => {
    if (userName) {
      setFormData(prev =>
        prev.name === userName ? prev : { ...prev, name: userName }
      );
    }
  }, [userName]);

  /**
   * フォームフィールドを更新
   */
  const updateFormField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 入力変更ハンドラ
   */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateFormField(name as keyof typeof formData, value);
  };

  /**
   * 勤務表ファイル追加ハンドラ
   */
  const handleWorkScheduleFilesChange = (files: File[]) => {
    updateFormField('workScheduleFiles', [
      ...formData.workScheduleFiles,
      ...files,
    ]);
  };

  /**
   * 勤務表ファイル削除ハンドラ
   */
  const removeWorkScheduleFile = (indexToRemove: number) => {
    updateFormField(
      'workScheduleFiles',
      formData.workScheduleFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  /**
   * フォーム送信ハンドラ
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    try {
      // シンプルなバリデーション
      const errors: string[] = [];

      if (!formData.name.trim()) {
        errors.push('氏名を入力してください');
      }

      if (!formData.workStartTime) {
        errors.push('始業時間を入力してください');
      }

      if (!formData.workEndTime) {
        errors.push('終業時間を入力してください');
      }

      // 定期券購入が「有り」の場合の条件付きバリデーション
      if (formData.hasCommuterPass === 'yes') {
        if (!formData.nearestStation?.trim()) {
          errors.push('定期券購入が「有り」の場合、最寄り駅を入力してください');
        }
        if (!formData.workStation?.trim()) {
          errors.push('定期券購入が「有り」の場合、勤務先の駅を入力してください');
        }
        if (!formData.monthlyFee?.trim()) {
          errors.push('定期券購入が「有り」の場合、月額を入力してください');
        }
      }

      // バリデーションエラーがある場合
      if (errors.length > 0) {
        setErrorMessage(errors.join('\n'));
        setIsErrorModalOpen(true);
        setSubmitted(false);
        return;
      }

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
        await submitExpense(expenseData);
        onSubmitSuccess();
      } catch (error: any) {
        setErrorMessage(error.message || FORM_ERROR_MESSAGES.SUBMISSION_FAILED);
        setIsErrorModalOpen(true);
        setSubmitted(false);
      }
    } catch (error: any) {
      setErrorMessage(error.message || FORM_ERROR_MESSAGES.SUBMISSION_FAILED);
      setIsErrorModalOpen(true);
      setSubmitted(false);
    }
  };

  /**
   * エラーモーダルを閉じる
   */
  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
  };

  return {
    // フォーム状態
    formData,
    submitted,
    errorMessage,
    isErrorModalOpen,
    formRef,

    // ユーザー情報
    userName,
    isNameEditable,
    isLoadingUserInfo,

    // エントリー管理
    commuteEntries,
    expenseEntries,

    // ハンドラ
    handleInputChange,
    handleWorkScheduleFilesChange,
    removeWorkScheduleFile,
    handleSubmit,
    closeErrorModal,
  };
}
