import './app.css';
import { appState } from './modules/state';
import * as actions from './modules/actions';

// Alpine.js用のグローバル関数
declare global {
  interface Window {
    incidentApp: () => any;
  }
}

export function incidentApp() {
  return {
    ...appState,
    ...actions,
  };
}

// Alpine.jsのグローバル関数として登録
window.incidentApp = incidentApp;
