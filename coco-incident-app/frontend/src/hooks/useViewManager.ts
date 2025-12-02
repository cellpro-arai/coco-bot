import { useState } from 'react';
import { Incident } from '../types';

export const VIEW_VARIANT = {
  LIST: 'list',
  FORM: 'form',
} as const;

export type ViewVariant = (typeof VIEW_VARIANT)[keyof typeof VIEW_VARIANT];

export function useViewManager() {
  const [currentView, setCurrentView] = useState<ViewVariant>(
    VIEW_VARIANT.LIST
  );
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );

  const showForm = () => {
    setSelectedIncident(null);
    setCurrentView(VIEW_VARIANT.FORM);
  };

  const editIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setCurrentView(VIEW_VARIANT.FORM);
  };

  const backToList = () => {
    setCurrentView(VIEW_VARIANT.LIST);
    setSelectedIncident(null);
  };

  return {
    currentView,
    selectedIncident,
    showForm,
    editIncident,
    backToList,
  };
}
