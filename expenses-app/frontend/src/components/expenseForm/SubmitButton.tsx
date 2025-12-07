interface SubmitButtonProps {
  /** 送信中かどうか */
  isSubmitting: boolean;
}

/**
 * フォーム送信ボタンコンポーネント
 */
export default function SubmitButton({ isSubmitting }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-wait disabled:opacity-70"
    >
      {isSubmitting && (
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
          aria-hidden="true"
        />
      )}
      <span>{isSubmitting ? '送信中...' : '提出する'}</span>
    </button>
  );
}
