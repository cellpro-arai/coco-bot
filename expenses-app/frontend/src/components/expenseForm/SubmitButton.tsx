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
      className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isSubmitting ? '送信中...' : '提出する'}
    </button>
  );
}
