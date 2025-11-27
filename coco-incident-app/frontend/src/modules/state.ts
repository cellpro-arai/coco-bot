/**
 * @fileoverview アプリケーションの状態管理
 */

import { Incident, IncidentFormData, AI_ANALYSIS_STATUS } from './types';

// 初期状態のフォームデータ
export const initialFormData: IncidentFormData = {
  registeredDate: '',
  caseName: '',
  assignee: '',
  summary: '',
  stakeholders: '',
  details: '',
  status: '対応中',
  fileDataList: [],
};

// アプリケーションの全体的な状態
export const appState = {
  // ビュー管理
  currentView: 'list' as 'list' | 'form',
  theme: localStorage.getItem('theme') || 'light',

  // データ管理
  incidents: [] as Incident[],
  loading: false,
  error: '',

  // フォーム管理
  submitting: false,
  showSuccessModal: false,
  submittedIncident: null as Incident | null,
  formData: { ...initialFormData },
  selectedIncident: null as Incident | null,

  // 定数
  AI_ANALYSIS_STATUS,
};

export type AppState = typeof appState;
