import React from 'react';
import { InputDate, InputUrl } from '../component';

export const ExpensesPage: React.FC = () => {
  return (
    <div>
      <h2>Expenses Page</h2>
      <InputDate title='Select Date' />
      <InputDate title='Select Month' />
      <InputUrl title='Website URL' url='' />
    </div>
  );
};
