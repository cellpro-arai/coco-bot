import { CommuteEntry, ExpenseEntry } from '../types';

export const createEmptyCommuteEntry = (): CommuteEntry => ({
  date: '',
  origin: '',
  destination: '',
  amount: '',
  tripType: 'oneWay',
});

export const createEmptyExpenseEntry = (): ExpenseEntry => ({
  date: '',
  category: 'ebook',
  description: '',
  amount: '',
  receiptFile: null,
  certificateFile: null,
});
