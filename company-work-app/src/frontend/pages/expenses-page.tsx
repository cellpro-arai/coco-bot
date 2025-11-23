import React from 'react';
import { DateComponent, DateFormat } from '../component';

export const ExpensesPage: React.FC = () => {
  return (
    <div>
      <h2>Expenses Page</h2>
      <DateComponent title='Select Date' format={DateFormat.YYYYMMDD} />
      <DateComponent title='Select Month' format={DateFormat.YYYYMM} />
    </div>
  );
};
