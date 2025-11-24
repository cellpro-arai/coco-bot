import React from 'react';
import { InputDate, DateFormat, InputUrl } from '../component';

export const ExpensesPage: React.FC = () => {
  return (
    <div>
      <h2>Expenses Page</h2>
      <InputDate title='Select Date' format={DateFormat.YYYYMMDD} />
      <InputDate title='Select Month' format={DateFormat.YYYYMM} />
      <InputUrl title='Website URL' url='' />
    </div>
  );
};
