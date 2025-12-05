import React from 'react';
import Modal from './Modal';
import { Button } from '../ui';
import { ExclamationCircleIcon, ArrowTopRightOnSquareIcon } from '../icons';

interface ConfirmEditIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onEditSpreadsheet: () => void;
  incidentName?: string;
  isLoading?: boolean;
}

const ConfirmEditIncidentModal: React.FC<ConfirmEditIncidentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onEditSpreadsheet,
  incidentName = 'インシデント',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
          <ExclamationCircleIcon className="mr-2 w-5 h-5" />
          インシデント更新の確認
        </div>
      }
      size="sm"
      footer={
        <div className="flex justify-center gap-3">
          <Button
            variant="secondary"
            onClick={onEditSpreadsheet}
            disabled={isLoading}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            シートへ
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? '開く中...' : 'そのまま開く'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-gray-700 dark:text-gray-300">
          <span className="font-semibold">{incidentName}</span>
          を編集しますか？
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
            ⚠️{' '}
            <span className="font-semibold">
              注意：スプレッドシートのデータが上書きされる可能性があります
            </span>
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            複数人で同時に編集している場合は、スプレッドシートで直接更新することをお勧めします。
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmEditIncidentModal;
