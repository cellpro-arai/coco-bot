import { useState } from 'react';
import { ExpenseEntry } from '../types';
import { EXPENSE_ERROR_MESSAGES } from '../types/constants';
import { createEmptyExpenseEntry } from '../utils/formUtils';
import { encodeFileToBase64 } from '../utils/fileUtils';

// 経費入力カードの状態管理と検証をまとめたカスタムフック
export function useExpenseEntries(
  clearError?: (index: number, field?: keyof ExpenseEntry) => void
) {
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);

  // 入力値の更新と付随処理 (添付ファイルのリセットなど) をまとめて制御
  const handleChange = (
    index: number,
    field: keyof ExpenseEntry,
    value: string
  ) => {
    setEntries(prev =>
      prev.map((entry, idx) => {
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
    // 値が入力されたらエラーをクリア
    if (value.trim() && clearError) {
      clearError(index, field);
    }
  };

  const handleReceiptChange = (index: number, file: File | null) => {
    setEntries(prev =>
      prev.map((entry, idx) =>
        idx === index ? { ...entry, receiptFile: file } : entry
      )
    );
    // ファイルが選択されたらエラーをクリア
    if (file && clearError) {
      clearError(index, 'receiptFile');
    }
  };

  const handleCertificateChange = (index: number, file: File | null) => {
    setEntries(prev =>
      prev.map((entry, idx) =>
        idx === index ? { ...entry, certificateFile: file } : entry
      )
    );
    // ファイルが選択されたらエラーをクリア
    if (file && clearError) {
      clearError(index, 'certificateFile');
    }
  };

  const add = () => {
    setEntries(prev => [...prev, createEmptyExpenseEntry()]);
  };

  const remove = (index: number) => {
    setEntries(prev => prev.filter((_, idx) => idx !== index));
  };

  const validateEntry = (entry: ExpenseEntry) => {
    if (!entry.date || !entry.description || !entry.amount) {
      throw new Error(EXPENSE_ERROR_MESSAGES.EXPENSE_INCOMPLETE);
    }
    if (!entry.receiptFile) {
      throw new Error(EXPENSE_ERROR_MESSAGES.RECEIPT_REQUIRED);
    }
    const category = entry.category || 'other';
    if (category === 'certification' && !entry.certificateFile) {
      throw new Error(EXPENSE_ERROR_MESSAGES.CERTIFICATE_REQUIRED);
    }
  };

  // Drive へ渡すためファイルを Base64 へ変換する
  const encodeFiles = async (entry: ExpenseEntry) => {
    const receiptFileData = await encodeFileToBase64(entry.receiptFile!);
    if (!receiptFileData) {
      throw new Error(EXPENSE_ERROR_MESSAGES.RECEIPT_ENCODE_FAILED);
    }

    const category = entry.category || 'other';
    let certificateFileData = null;
    if (category === 'certification' && entry.certificateFile) {
      certificateFileData = await encodeFileToBase64(entry.certificateFile);
      if (!certificateFileData) {
        throw new Error(EXPENSE_ERROR_MESSAGES.CERTIFICATE_ENCODE_FAILED);
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

  // 未入力行を除外しつつ validate → encode を順番に実行
  const collectEntries = async () => {
    const filledEntries = entries.filter(
      entry => entry.date || entry.description || entry.amount
    );

    filledEntries.forEach(validateEntry);
    return Promise.all(filledEntries.map(encodeFiles));
  };

  const reset = () => {
    setEntries([]);
  };

  return {
    entries,
    handleChange,
    handleReceiptChange,
    handleCertificateChange,
    add,
    remove,
    collectEntries,
    reset,
  };
}
