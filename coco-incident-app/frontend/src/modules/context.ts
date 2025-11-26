/**
 * @fileoverview Alpine.jsコンポーネントの型定義
 */
import { AppState } from './state';
import { Incident } from './types';

// thisコンテキストの型を定義
// Alpine.jsのコンポーネントが持つプロパティとメソッドの型
export type ComponentContext = AppState & {
  // actions
  init: () => void;
  loadIncidents: () => Promise<void>;
  submitForm: () => Promise<void>;
  resetForm: () => void;
  handleFileUpload: (event: Event) => void;
  showForm: () => void;
  editIncident: (incident: Incident) => void;
  backToList: () => void;
  applyTheme: () => void;
  toggleTheme: () => void;
};
