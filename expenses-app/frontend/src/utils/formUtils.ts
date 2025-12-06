import { CommuteEntry, ExpenseEntry } from '../types';

/**
 * 交通費明細フォームの初期値を生成します
 */
export const createEmptyCommuteEntry = (): CommuteEntry => ({
  date: '',
  origin: '',
  destination: '',
  amount: '',
  tripType: 'oneWay',
});

/**
 * 経費明細フォームの初期値を生成します
 */
export const createEmptyExpenseEntry = (): ExpenseEntry => ({
  date: '',
  category: 'ebook',
  description: '',
  amount: '',
  receiptFile: null,
  certificateFile: null,
});
