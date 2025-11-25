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
  } catch (error: any) {
    this.error = error.message;
  } finally {
    this.loading = false;
  }
}
