import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { submitExpense } from '../services/apiService';
import { encodeFileToBase64 } from '../utils/fileUtils';
import { getDefaultSubmissionMonth } from '../utils/dateUtils';
import { FORM_ERROR_MESSAGES } from '../types/constants';
import { DEFAULT_WORK_HOURS } from '../types/constants';
import { useCommuteEntries } from './useCommuteEntries';
import { useExpenseEntries } from './useExpenseEntries';
import { useUserInfo } from './useUserInfo';
import type { FormData } from '../types';

/**
 * バリデーションエラー型定義
 */
interface ValidationErrors {
  // シンプルフィールドのエラー
  name?: string;
  submissionMonth?: string;
  workStartTime?: string;
  workEndTime?: string;
  officeFrequency?: string;
  workScheduleFiles?: string;
  nearestStation?: string;
  workStation?: string;
  monthlyFee?: string;
  // 交通費エントリーのエラー（インデックス別）
  commuteEntries?: {
    [index: number]: {
      date?: string;
      origin?: string;
      destination?: string;
      amount?: string;
      tripType?: string;
    };
  };
  // 経費エントリーのエラー（インデックス別）
  expenseEntries?: {
    [index: number]: {
      category?: string;
      date?: string;
      amount?: string;
      description?: string;
      receiptFile?: string;
      certificateFile?: string;
    };
  };
}

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

  // バリデーションエラー状態
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  /**
   * 指定フィールドのバリデーションエラーをクリア
   */
  const clearFieldError = (fieldName: keyof ValidationErrors) => {
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  /**
   * 交通費エントリーの特定フィールドエラーをクリア
   */
  const clearCommuteEntryError = (
    index: number,
    field?: 'date' | 'origin' | 'destination' | 'amount' | 'tripType'
  ) => {
    setValidationErrors(prev => {
      const next = { ...prev };
      if (next.commuteEntries?.[index]) {
        if (field) {
          delete next.commuteEntries[index][field];
          // エントリー内のエラーがすべてクリアされたらエントリー自体も削除
          if (Object.keys(next.commuteEntries[index]).length === 0) {
            delete next.commuteEntries[index];
          }
        } else {
          delete next.commuteEntries[index];
        }
      }
      return next;
    });
  };

  /**
   * 経費エントリーの特定フィールドエラーをクリア
   */
  const clearExpenseEntryError = (
    index: number,
    field?:
      | 'category'
      | 'date'
      | 'amount'
      | 'description'
      | 'receiptFile'
      | 'certificateFile'
  ) => {
    setValidationErrors(prev => {
      const next = { ...prev };
      if (next.expenseEntries?.[index]) {
        if (field) {
          delete next.expenseEntries[index][field];
          // エントリー内のエラーがすべてクリアされたらエントリー自体も削除
          if (Object.keys(next.expenseEntries[index]).length === 0) {
            delete next.expenseEntries[index];
          }
        } else {
          delete next.expenseEntries[index];
        }
      }
      return next;
    });
  };

  // セクション表示制御の状態
  const [hasWorkHours, setHasWorkHours] = useState<'yes' | 'no'>('no');
  const [hasCommute, setHasCommute] = useState<'yes' | 'no'>('no');
  const [hasExpense, setHasExpense] = useState<'yes' | 'no'>('no');

  const commuteEntries = useCommuteEntries(clearCommuteEntryError);
  const expenseEntries = useExpenseEntries(clearExpenseEntryError);
  const { userName, isNameEditable, isLoadingUserInfo } = useUserInfo();

  // ユーザー情報が取得できたら氏名を設定
  useEffect(() => {
    if (userName) {
      setFormData(prev =>
        prev.name === userName ? prev : { ...prev, name: userName }
      );
    }
  }, [userName]);

  // 交通費セクションで「あり」を選択したときに1行追加
  useEffect(() => {
    if (hasCommute === 'yes' && commuteEntries.entries.length === 0) {
      commuteEntries.add();
    }
  }, [hasCommute, commuteEntries]);

  // 経費セクションで「あり」を選択したときに1行追加
  useEffect(() => {
    if (hasExpense === 'yes' && expenseEntries.entries.length === 0) {
      expenseEntries.add();
    }
  }, [hasExpense, expenseEntries]);

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
   * 入力変更ハンドラ（バリデーションエラーのクリアも含む）
   */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateFormField(name as keyof typeof formData, value);

    // 値が入力されたらエラーをクリア
    if (value.trim()) {
      clearFieldError(name as keyof ValidationErrors);
    }
  };

  /**
   * 勤務表ファイル追加ハンドラ
   */
  const handleWorkScheduleFilesChange = (files: File[]) => {
    updateFormField('workScheduleFiles', [
      ...formData.workScheduleFiles,
      ...files,
    ]);
    // ファイルが追加されたらエラーをクリア
    if (files.length > 0) {
      clearFieldError('workScheduleFiles');
    }
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
   * フォーム送信ハンドラ（包括的なバリデーション付き）
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    try {
      const newErrors: ValidationErrors = {};

      // 1. 氏名バリデーション
      if (!formData.name.trim()) {
        newErrors.name = '氏名を入力してください';
      }

      // 2. 提出月バリデーション（通常は選択式なので空にはならないが念のため）
      if (!formData.submissionMonth) {
        newErrors.submissionMonth = '提出月を選択してください';
      }

      // 3. 現場勤務状況バリデーション
      if (!formData.workStartTime) {
        newErrors.workStartTime = '始業時間を入力してください';
      }
      if (!formData.workEndTime) {
        newErrors.workEndTime = '終業時間を入力してください';
      }
      if (!formData.officeFrequency) {
        newErrors.officeFrequency = '出社頻度を選択してください';
      }

      // 4. 勤務表バリデーション
      if (hasWorkHours === 'yes' && formData.workScheduleFiles.length === 0) {
        newErrors.workScheduleFiles = '勤務表をアップロードしてください';
      }

      // 5. 交通費バリデーション
      if (hasCommute === 'yes') {
        if (commuteEntries.entries.length === 0) {
          // 交通費ありの場合、少なくとも1つのエントリーが必要
          newErrors.commuteEntries = { 0: { date: '交通費の入力が必要です' } };
        } else {
          // 各エントリーのフィールドをチェック
          commuteEntries.entries.forEach((entry, index) => {
            if (!entry.date) {
              if (!newErrors.commuteEntries) newErrors.commuteEntries = {};
              if (!newErrors.commuteEntries[index])
                newErrors.commuteEntries[index] = {};
              newErrors.commuteEntries[index].date = '日付を入力してください';
            }
            if (!entry.origin?.trim()) {
              if (!newErrors.commuteEntries) newErrors.commuteEntries = {};
              if (!newErrors.commuteEntries[index])
                newErrors.commuteEntries[index] = {};
              newErrors.commuteEntries[index].origin = '最寄り駅を入力してください';
            }
            if (!entry.destination?.trim()) {
              if (!newErrors.commuteEntries) newErrors.commuteEntries = {};
              if (!newErrors.commuteEntries[index])
                newErrors.commuteEntries[index] = {};
              newErrors.commuteEntries[index].destination =
                '訪問先駅を入力してください';
            }
            if (!entry.amount?.trim()) {
              if (!newErrors.commuteEntries) newErrors.commuteEntries = {};
              if (!newErrors.commuteEntries[index])
                newErrors.commuteEntries[index] = {};
              newErrors.commuteEntries[index].amount = '金額を入力してください';
            }
          });
        }
      }

      // 6. 経費バリデーション
      if (hasExpense === 'yes') {
        if (expenseEntries.entries.length === 0) {
          // 経費ありの場合、少なくとも1つのエントリーが必要
          newErrors.expenseEntries = { 0: { date: '経費の入力が必要です' } };
        } else {
          // 各エントリーのフィールドをチェック
          expenseEntries.entries.forEach((entry, index) => {
            if (!entry.category) {
              if (!newErrors.expenseEntries) newErrors.expenseEntries = {};
              if (!newErrors.expenseEntries[index])
                newErrors.expenseEntries[index] = {};
              newErrors.expenseEntries[index].category = '経費種別を選択してください';
            }
            if (!entry.date) {
              if (!newErrors.expenseEntries) newErrors.expenseEntries = {};
              if (!newErrors.expenseEntries[index])
                newErrors.expenseEntries[index] = {};
              newErrors.expenseEntries[index].date = '日付を入力してください';
            }
            if (!entry.amount?.trim()) {
              if (!newErrors.expenseEntries) newErrors.expenseEntries = {};
              if (!newErrors.expenseEntries[index])
                newErrors.expenseEntries[index] = {};
              newErrors.expenseEntries[index].amount = '金額を入力してください';
            }
            if (!entry.description?.trim()) {
              if (!newErrors.expenseEntries) newErrors.expenseEntries = {};
              if (!newErrors.expenseEntries[index])
                newErrors.expenseEntries[index] = {};
              newErrors.expenseEntries[index].description =
                '内容を入力してください';
            }
            if (!entry.receiptFile) {
              if (!newErrors.expenseEntries) newErrors.expenseEntries = {};
              if (!newErrors.expenseEntries[index])
                newErrors.expenseEntries[index] = {};
              newErrors.expenseEntries[index].receiptFile =
                '領収書をアップロードしてください';
            }
            // 資格受験の場合は合格通知書も必須
            if (entry.category === 'certification' && !entry.certificateFile) {
              if (!newErrors.expenseEntries) newErrors.expenseEntries = {};
              if (!newErrors.expenseEntries[index])
                newErrors.expenseEntries[index] = {};
              newErrors.expenseEntries[index].certificateFile =
                '合格通知書をアップロードしてください';
            }
          });
        }
      }

      // 7. 定期券購入バリデーション
      if (formData.hasCommuterPass === 'yes') {
        if (!formData.nearestStation?.trim()) {
          newErrors.nearestStation = '最寄り駅を入力してください';
        }
        if (!formData.workStation?.trim()) {
          newErrors.workStation = '勤務先の駅を入力してください';
        }
        if (!formData.monthlyFee?.trim()) {
          newErrors.monthlyFee = '月額を入力してください';
        } else if (Number(formData.monthlyFee) < 0) {
          newErrors.monthlyFee = '月額は0以上の数値を入力してください';
        }
      }

      // バリデーションエラーがある場合
      if (Object.keys(newErrors).length > 0) {
        console.log('Validation errors:', newErrors);
        setValidationErrors(newErrors);
        setSubmitted(false);

        // 最初のエラーフィールドにフォーカス
        // フォーム上の表示順序でエラーをチェック
        setTimeout(() => {
          let focusedElement: HTMLElement | null = null;

          // 1. 氏名
          if (newErrors.name) {
            focusedElement = document.getElementById('name');
          }
          // 2. 提出月
          else if (newErrors.submissionMonth) {
            focusedElement = document.getElementById('submissionMonth');
          }
          // 3. 始業時間
          else if (newErrors.workStartTime) {
            focusedElement = document.getElementById('workStartTime');
          }
          // 4. 終業時間
          else if (newErrors.workEndTime) {
            focusedElement = document.getElementById('workEndTime');
          }
          // 5. 出社頻度
          else if (newErrors.officeFrequency) {
            focusedElement = document.getElementById('officeFrequency');
          }
          // 6. 勤務表（ファイル選択ボタン）
          else if (newErrors.workScheduleFiles) {
            // ファイル選択ボタンは直接フォーカスできないため、親要素にスクロール
            const fileButton = document.querySelector(
              'button[type="button"]'
            ) as HTMLElement;
            if (fileButton && fileButton.textContent?.includes('勤務表を選択')) {
              focusedElement = fileButton;
            }
          }
          // 7. 交通費エントリー
          else if (newErrors.commuteEntries) {
            const firstErrorIndex = Object.keys(newErrors.commuteEntries)[0];
            if (firstErrorIndex !== undefined) {
              const entryErrors = newErrors.commuteEntries[Number(firstErrorIndex)];
              if (entryErrors.date) {
                focusedElement = document.getElementById(
                  `commute-date-${firstErrorIndex}`
                );
              } else if (entryErrors.origin) {
                focusedElement = document.getElementById(
                  `commute-origin-${firstErrorIndex}`
                );
              } else if (entryErrors.destination) {
                focusedElement = document.getElementById(
                  `commute-destination-${firstErrorIndex}`
                );
              } else if (entryErrors.amount) {
                focusedElement = document.getElementById(
                  `commute-amount-${firstErrorIndex}`
                );
              }
            }
          }
          // 8. 経費エントリー
          else if (newErrors.expenseEntries) {
            const firstErrorIndex = Object.keys(newErrors.expenseEntries)[0];
            if (firstErrorIndex !== undefined) {
              const entryErrors = newErrors.expenseEntries[Number(firstErrorIndex)];
              if (entryErrors.category) {
                focusedElement = document.getElementById(
                  `expense-category-${firstErrorIndex}`
                );
              } else if (entryErrors.date) {
                focusedElement = document.getElementById(
                  `expense-date-${firstErrorIndex}`
                );
              } else if (entryErrors.amount) {
                focusedElement = document.getElementById(
                  `expense-amount-${firstErrorIndex}`
                );
              } else if (entryErrors.description) {
                focusedElement = document.getElementById(
                  `expense-description-${firstErrorIndex}`
                );
              } else if (entryErrors.receiptFile) {
                // 領収書のファイル選択ラベルにフォーカス
                const label = document.querySelector(
                  `label[for="expense-receipt-${firstErrorIndex}"]`
                ) as HTMLElement;
                if (label) {
                  focusedElement = label;
                }
              } else if (entryErrors.certificateFile) {
                // 合格通知書のファイル選択ラベルにフォーカス
                const label = document.querySelector(
                  `label[for="expense-certificate-${firstErrorIndex}"]`
                ) as HTMLElement;
                if (label) {
                  focusedElement = label;
                }
              }
            }
          }
          // 9. 最寄り駅（定期券購入）
          else if (newErrors.nearestStation) {
            focusedElement = document.getElementById('nearestStation');
          }
          // 10. 勤務先の駅（定期券購入）
          else if (newErrors.workStation) {
            focusedElement = document.getElementById('workStation');
          }
          // 11. 月額（定期券購入）
          else if (newErrors.monthlyFee) {
            focusedElement = document.getElementById('monthlyFee');
          }

          // フォーカスとスクロール
          if (focusedElement) {
            focusedElement.focus();
            focusedElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 100); // DOM更新後にフォーカスするため少し遅延

        return;
      }

      // バリデーション成功: エラーをクリア
      setValidationErrors({});

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

    // バリデーションエラー
    validationErrors,
    clearFieldError,
    clearCommuteEntryError,
    clearExpenseEntryError,

    // ユーザー情報
    userName,
    isNameEditable,
    isLoadingUserInfo,

    // セクション表示制御
    hasWorkHours,
    setHasWorkHours,
    hasCommute,
    setHasCommute,
    hasExpense,
    setHasExpense,

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
