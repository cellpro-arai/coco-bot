import React from 'react';
import Modal from './Modal';
import { Button } from '../ui';
import { FlagIcon, ArrowPathIcon } from '../icons';
import { INCIDENT_STATUS } from '../../types/constants';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string) => void;
  currentStatus: string;
  isLoading?: boolean;
  canChangeStatus: (newStatus: string) => boolean;
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  [INCIDENT_STATUS.REPORTED]: '担当者がインシデントを新規起票します',
  [INCIDENT_STATUS.REVIEW_REQUESTED]: '責任者へ確認依頼を行います',
  [INCIDENT_STATUS.REJECTED]: '責任者が確認し担当者に差し戻します',
  [INCIDENT_STATUS.IN_PROGRESS]: '責任者がインシデントを対応中です',
  [INCIDENT_STATUS.CLOSED]: 'インシデントが解決し対応が完了',
};

const STATUS_ORDER = [
  INCIDENT_STATUS.REPORTED,
  INCIDENT_STATUS.REVIEW_REQUESTED,
  INCIDENT_STATUS.REJECTED,
  INCIDENT_STATUS.IN_PROGRESS,
  INCIDENT_STATUS.CLOSED,
];

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  isLoading = false,
  canChangeStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    if (isOpen) {
      setSelectedStatus(null);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus);
    }
  };

  const availableStatuses = STATUS_ORDER.filter(
    status => canChangeStatus(status) && status !== currentStatus
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center text-blue-600 dark:text-blue-400">
          <FlagIcon className="mr-2 w-5 h-5" />
          ステータスを変更
        </div>
      }
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading || !selectedStatus}
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="mr-2 animate-spin w-4 h-4" />
                変更中...
              </>
            ) : (
              '変更する'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="font-semibold">現在のステータス: </span>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-sm">
              {currentStatus}
            </span>
          </p>
        </div>

        {availableStatuses.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            変更可能なステータスはありません
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {availableStatuses.map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                disabled={isLoading}
                className={`group relative p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  selectedStatus === status
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-900/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center mt-0.5 ${
                      selectedStatus === status
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500'
                    }`}
                  >
                    {selectedStatus === status && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {status}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {STATUS_DESCRIPTIONS[status]}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StatusChangeModal;
