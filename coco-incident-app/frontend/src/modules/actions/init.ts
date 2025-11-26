import { ComponentContext } from '../context';

/**
 * アプリケーションを初期化します。
 */
export function init(this: ComponentContext) {
  this.applyTheme();
  this.loadIncidents();
}
