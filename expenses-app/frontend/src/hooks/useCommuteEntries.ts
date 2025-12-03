import { useState } from 'react';
import { CommuteEntry } from '../types';
import { createEmptyCommuteEntry } from '../utils/formUtils';

const ERROR_MESSAGES = {
  COMMUTE_INCOMPLETE:
    '交通費の各項目（日時・最寄り駅・訪問先駅・金額）を入力してください。',
} as const;

export function useCommuteEntries() {
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
          throw new Error(ERROR_MESSAGES.COMMUTE_INCOMPLETE);
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
