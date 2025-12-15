import { useState } from 'react';
import { CommuteEntry } from '../types';
import { COMMUTE_ERROR_MESSAGES } from '../types/constants';
import { createEmptyCommuteEntry } from '../utils/formUtils';

export function useCommuteEntries(
  clearError?: (index: number, field?: keyof CommuteEntry) => void
) {
  const [entries, setEntries] = useState<CommuteEntry[]>([]);

  const handleChange = (
    index: number,
    field: keyof CommuteEntry,
    value: string
  ) => {
    setEntries(prev =>
      prev.map((entry, idx) =>
        idx === index ? { ...entry, [field]: value } : entry
      )
    );
    // 値が入力されたらエラーをクリア
    if (value.trim() && clearError) {
      clearError(index, field);
    }
  };

  const add = () => {
    setEntries(prev => [...prev, createEmptyCommuteEntry()]);
  };

  const remove = (index: number) => {
    setEntries(prev => prev.filter((_, idx) => idx !== index));
  };

  const duplicate = (index: number) => {
    setEntries(prev => {
      const cloned = { ...prev[index], date: '' };
      const updated = [...prev];
      updated.splice(index + 1, 0, cloned);
      return updated;
    });
  };

  const collectEntries = () => {
    return entries
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
          throw new Error(COMMUTE_ERROR_MESSAGES.COMMUTE_INCOMPLETE);
        }
        return { ...entry, tripType: entry.tripType || 'oneWay' };
      });
  };

  const reset = () => {
    setEntries([]);
  };

  return {
    entries,
    handleChange,
    add,
    remove,
    duplicate,
    collectEntries,
    reset,
  };
}
