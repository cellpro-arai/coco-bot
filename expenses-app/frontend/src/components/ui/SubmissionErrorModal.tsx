/**
 * 提出エラーモーダルのプロパティ
 */
interface SubmissionErrorModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** エラーメッセージ */
  message: string;
  /** モーダルを閉じる際のコールバック */
  onClose: () => void;
}

/**
 * 経費提出時のエラーを表示するモーダルコンポーネント
 *
 * @param props - SubmissionErrorModalPropsオブジェクト
 * @returns エラーモーダルコンポーネント
 *
 * @example
 * ```tsx
 * <SubmissionErrorModal
 *   isOpen={isErrorModalOpen}
 *   message={errorMessage}
 *   onClose={() => setIsErrorModalOpen(false)}
 * />
 * ```
 */
export default function SubmissionErrorModal({
  isOpen,
  message,
  onClose,
}: SubmissionErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="mx-4 max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* アイコンとタイトル */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
            <i className="bi bi-exclamation-triangle-fill text-xl text-rose-600" aria-hidden="true"></i>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            提出エラー
          </h2>
        </div>

        {/* エラーメッセージ */}
        <div className="mb-6 text-sm text-slate-700">
          {message}
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-slate-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-slate-500/30 transition hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
