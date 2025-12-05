import React from 'react';
import { Incident } from '../../types';
import { Alert, ALERT_VARIANT } from '../ui';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  LightBulbIcon,
} from '../icons';
import Modal from './Modal';

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
    <Modal
      isOpen={true}
      onClose={closeSuccessModal}
      title={
        <div className="flex items-center">
          <CheckCircleIcon className="mr-2 w-5 h-5" />
          <span>
            インシデント情報の{isUpdate ? '更新' : '登録'}が完了しました！
          </span>
        </div>
      }
      subtitle="以下の内容で処理されました。"
      footer={
        <button
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={closeSuccessModal}
        >
          <ArrowLeftIcon className="mr-2 w-4 h-4" />
          一覧へ戻る
        </button>
      }
    >
      {/* AI改善案の生成（手動） */}
      <Alert variant={ALERT_VARIANT.WARNING}>
        <header className="mb-2">
          <h6 className="flex items-center text-base font-semibold mb-0 text-gray-900 dark:text-gray-100">
            <LightBulbIcon className="mr-2 w-5 h-5" />
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
          <ArrowTopRightOnSquareIcon className="mr-1 w-4 h-4" />
          詳細スプレッドシートを開く
        </a>
      </Alert>
    </Modal>
  );
};

export default SuccessModal;
