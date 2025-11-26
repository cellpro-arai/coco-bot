import * as api from '../api';
import { ComponentContext } from '../context';

/**
 * インシデント一覧を読み込みます。
 */
export async function loadIncidents(this: ComponentContext) {
  this.loading = true;
  this.error = '';
  try {
    this.incidents = await api.getIncidentList();
    // 空配列が返された場合でもエラーとはしない（権限がない場合も空配列が返る）
  } catch (error: any) {
    this.error = error.message || 'データの読み込みに失敗しました';
    this.incidents = [];
  } finally {
    this.loading = false;
  }
}
