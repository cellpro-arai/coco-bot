interface FieldErrorTooltipProps {
  /** エラーメッセージ。空文字またはnullの場合は非表示 */
  message?: string | null;
  /** ツールチップの位置クラス（任意） */
  className?: string;
}

/**
 * フィールドエラーツールチップコンポーネント
 *
 * バリデーションエラーを入力フィールドの近くに表示する小さなツールチップ。
 * Tailwindでスタイリングされ、アクセシビリティ対応（role="alert"、aria-live）。
 */
export default function FieldErrorTooltip({
  message,
  className = '',
}: FieldErrorTooltipProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mt-1 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700 ${className}`}
    >
      <div className="flex items-start gap-2">
        <svg
          className="h-4 w-4 flex-shrink-0 text-rose-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
        <span className="flex-1">{message}</span>
      </div>
    </div>
  );
}
