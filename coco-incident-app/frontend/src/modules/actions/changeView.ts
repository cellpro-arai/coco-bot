import { Incident } from '../types';
import { ComponentContext } from '../context';

/**
 * 新規起票画面を表示します。
 */
export function showForm(this: ComponentContext) {
  this.resetForm();
  this.currentView = 'form';
}

/**
 * 編集画面を表示します。
 * @param incident 編集するインシデントデータ
 */
export function editIncident(this: ComponentContext, incident: Incident) {
  this.resetForm(); // まずフォームをリセット

  // 選択されたインシデントを保存
  this.selectedIncident = incident;

  // 一覧から取得した基本情報を設定
  this.formData.registeredDate = incident.registeredDate;
  this.formData.caseName = incident.caseName;
  this.formData.assignee = incident.assignee;
  this.formData.status = incident.status;

  // 詳細情報を設定（バックエンドで取得済み）
  this.formData.summary = incident.summary || '';
  this.formData.stakeholders = incident.stakeholders || '';
  this.formData.details = incident.details || '';
  this.formData.previousAiSuggestions = incident.improvementSuggestions || '';
  this.formData.fileDataList = [];

  this.currentView = 'form';
}

/**
 * 一覧画面に戻ります。
 */
export function backToList(this: ComponentContext) {
  this.currentView = 'list';
  this.selectedIncident = null;
  this.resetForm();
}
