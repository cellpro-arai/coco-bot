import React from 'react';
import { Incident } from '../../types';
import { Alert, ALERT_VARIANT } from '../ui';
import {
  ArrowLeftIcon,
  BoxArrowUpRightIcon,
  CheckCircleFillIcon,
  LightbulbFillIcon,
} from '../icons';

interface SuccessModalProps {
  submittedIncident: Incident;
  closeSuccessModal: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  submittedIncident,
  closeSuccessModal,
}) => {
  const isUpdate =
    submittedIncident.updateDate !== submittedIncident.registeredDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={closeSuccessModal}
            className="float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
          <div>
            <h3 className="flex items-center text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              <CheckCircleFillIcon className="mr-2" />
              <span>
                インシデント情報の{isUpdate ? '更新' : '登録'}が完了しました！
              </span>
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              以下の内容で処理されました。
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* AI改善案の生成（手動） */}
          <Alert variant={ALERT_VARIANT.WARNING} className="mb-4">
            <header className="mb-2">
              <h6 className="flex items-center text-base font-semibold mb-0 text-gray-900 dark:text-gray-100">
                <LightbulbFillIcon className="mr-2" />
                AI改善案を生成しましょう
              </h6>
            </header>

            <p className="mb-3 text-gray-700 dark:text-gray-300">
              AIによる改善案を生成するには、手動での更新が必要です。
              <br />
              スプレッドシートを開き、改善案の数式セル（B5）を再計算してください。
            </p>

            <a
              href={submittedIncident.incidentDetailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              role="button"
            >
              <BoxArrowUpRightIcon className="mr-1" />
              詳細スプレッドシートを開く
            </a>
          </Alert>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={closeSuccessModal}
          >
            <ArrowLeftIcon className="mr-2" />
            一覧へ戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
