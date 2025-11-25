import { ComponentContext } from "../context";

/**
 * テーマを適用します。
 */
export function applyTheme(this: ComponentContext) {
  document.documentElement.setAttribute('data-theme', this.theme);
}

/**
 * テーマを切り替えます。
 */
export function toggleTheme(this: ComponentContext) {
  this.theme = this.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', this.theme);
  this.applyTheme();
}
