import { useState } from 'react';
import { ExpenseEntry } from '../types';
import { createEmptyExpenseEntry } from '../utils/formUtils';
import { encodeFileToBase64 } from '../utils/fileUtils';

const ERROR_MESSAGES = {
  EXPENSE_INCOMPLETE: '経費の日付、内容、金額を入力してください。',
  RECEIPT_REQUIRED: '経費には領収書の添付が必須です。',
  CERTIFICATE_REQUIRED: '資格受験の経費には合格通知書の添付が必須です。',
  RECEIPT_ENCODE_FAILED: '領収書の変換に失敗しました。',
  CERTIFICATE_ENCODE_FAILED: '合格通知書の変換に失敗しました。',
} as const;

export function useExpenseEntries() {
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);

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
  };

  const handleReceiptChange = (index: number, file: File | null) => {
    setEntries(prev =>
      prev.map((entry, idx) =>
        idx === index ? { ...entry, receiptFile: file } : entry
      )
    );
  };

  const handleCertificateChange = (index: number, file: File | null) => {
    setEntries(prev =>
      prev.map((entry, idx) =>
        idx === index ? { ...entry, certificateFile: file } : entry
      )
    );
  };

  const add = () => {
    setEntries(prev => [...prev, createEmptyExpenseEntry()]);
  };

  const remove = (index: number) => {
    setEntries(prev => prev.filter((_, idx) => idx !== index));
  };

  const validateEntry = (entry: ExpenseEntry) => {
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

  const encodeFiles = async (entry: ExpenseEntry) => {
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
