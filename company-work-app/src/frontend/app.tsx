import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ExpensesPage } from './pages/expenses-page';

export const App: React.FC = () => {
  return (
    <div>
      <h1>Company Work App</h1>
      <p>Welcome to the Company Work Application!</p>
      <BrowserRouter>
        <Routes>
          <Route path='*' element={<ExpensesPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};
