import { useViewManager, VIEW_VARIANT } from '../hooks/useViewManager';
import ExpenseFormPage from './ExpenseFormPage';
import ExpenseFormCompletePage from './ExpenseFormCompletePage';

export default function MainPage() {
  const { currentView, showForm, showComplete } = useViewManager();

  return (
    <>
      {currentView === VIEW_VARIANT.FORM && (
        <ExpenseFormPage onSubmitSuccess={showComplete} />
      )}

      {currentView === VIEW_VARIANT.COMPLETE && (
        <ExpenseFormCompletePage onBackToForm={showForm} />
      )}
    </>
  );
}
