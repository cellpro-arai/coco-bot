import { Incident } from "../types";
import { ComponentContext } from "../context";

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

  // 一覧から取得した基本情報を設定
  this.formData.registeredDate = incident.registeredDate;
  this.formData.caseName = incident.caseName;
  this.formData.assignee = incident.assignee;
  this.formData.status = incident.status;

  // TODO: 詳細情報は、別途APIを呼び出して取得する必要がある。
  // 今回のリファクタリングではスコープ外とし、空欄で表示する。
  this.formData.summary = '';
  this.formData.stakeholders = '';
  this.formData.details = '';
  this.formData.previousAiSuggestions = '';
  this.formData.fileDataList = [];

  this.currentView = 'form';
}

/**
 * 一覧画面に戻ります。
 */
export function backToList(this: ComponentContext) {
  this.currentView = 'list';
  this.resetForm();
  this.loadIncidents();
}