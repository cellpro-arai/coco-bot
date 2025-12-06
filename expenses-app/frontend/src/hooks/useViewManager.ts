import { useState } from 'react';

export const VIEW_VARIANT = {
  FORM: 'form',
  COMPLETE: 'complete',
} as const;

export type ViewVariant = (typeof VIEW_VARIANT)[keyof typeof VIEW_VARIANT];

export function useViewManager() {
  const [currentView, setCurrentView] = useState<ViewVariant>(
    VIEW_VARIANT.FORM
  );

  const showForm = () => {
    setCurrentView(VIEW_VARIANT.FORM);
  };

  const showComplete = () => {
    setCurrentView(VIEW_VARIANT.COMPLETE);
  };

  return {
    currentView,
    showForm,
    showComplete,
  };
}
