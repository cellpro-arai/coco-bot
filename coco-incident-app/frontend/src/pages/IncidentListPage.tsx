import React from 'react';
import { Incident } from '../types';
import { Button, Card, Badge, Alert, ALERT_VARIANT } from '../components/ui';
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  FlagIcon,
  InformationCircleIconOutline,
  ListBulletIcon,
  UserIcon,
  PlusCircleIcon,
  UsersIcon,
  ArrowPathIcon,
} from '../components/icons';
import { ConfirmEditIncidentModal } from '../components/modals';
import { INCIDENT_STATUS } from '../types/constants';
import { updateIncidentStatus } from '../services/incidentService';
import { canChangeStatus, getAllStatuses } from '../utils';

interface IncidentListPageProps {
  incidents: Incident[];
  uploadFolderUrl: string;
  showForm: () => void;
  editIncident: (incident: Incident) => void;
  showPermissionManagement?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isAdmin?: boolean;
}

const IncidentListPage: React.FC<IncidentListPageProps> = ({
  incidents,
  uploadFolderUrl,
  showForm,
  editIncident,
  showPermissionManagement,
  onRefresh,
  isRefreshing = false,
  isAdmin = false,
}) => {
  // uploadFolderUrl が空の場合はローディング状態
  const isLoading = !uploadFolderUrl;

  // 確認モーダルの状態
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [selectedIncident, setSelectedIncident] =
    React.useState<Incident | null>(null);

  // ステータス変更UI関連の状態
  const [statusChangeIncident, setStatusChangeIncident] =
    React.useState<Incident | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = React.useState(false);

  // カードクリック時の処理
  const handleCardClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsConfirmOpen(true);
  };

  // 「そのまま開く」ボタンクリック時の処理
  const handleConfirmEdit = () => {
    if (selectedIncident) {
      setIsConfirmOpen(false);
      editIncident(selectedIncident);
    }
  };

  // スプレッドシートで直接編集する処理
  const handleEditSpreadsheet = () => {
    if (selectedIncident && selectedIncident.driveFolderUrl) {
      // スプレッドシートフォルダを開く
      window.open(selectedIncident.driveFolderUrl, '_blank');
      setIsConfirmOpen(false);
    }
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setIsConfirmOpen(false);
    setSelectedIncident(null);
  };

  // ステータス変更処理
  const handleStatusChange = async (newStatus: string) => {
    if (!statusChangeIncident) return;

    try {
      setIsStatusUpdating(true);
      await updateIncidentStatus(
        statusChangeIncident.registeredDate,
        newStatus
      );

      // ステータス変更後、インシデント一覧を更新する
      // 実装例：onRefresh()を呼ぶか、状態を直接更新
      if (onRefresh) {
        onRefresh();
      }

      setStatusChangeIncident(null);
    } catch (error) {
      console.error('ステータス変更に失敗しました:', error);
      // エラーハンドリング（トーストなど）が必要に応じて追加
    } finally {
      setIsStatusUpdating(false);
    }
  };

  return (
    <div className="py-4">
      {/* ツールバー */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center mb-0">
              <ListBulletIcon className="mr-2 w-8 h-8 flex-shrink-0" />
              インシデント一覧
            </h2>
            {uploadFolderUrl && (
              <a
                href={uploadFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors ml-2"
                title="Driveフォルダを開く"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
              </a>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {showPermissionManagement && (
              <Button
                variant="secondary"
                onClick={showPermissionManagement}
                disabled={isLoading}
              >
                <UsersIcon className="mr-2 w-4 h-4" />
                権限管理
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              title="更新"
            >
              <ArrowPathIcon
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button onClick={showForm} disabled={isLoading}>
              <PlusCircleIcon className="mr-2 w-4 h-4" />
              新規
            </Button>
          </div>
        </div>
      </div>

      {/* ローディング表示 */}
      {isLoading ? (
        <Card className="text-center py-12">
          <div className="animate-pulse">
            <p className="text-gray-600 dark:text-gray-400">
              データを読み込んでいます...
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* カード一覧 */}
          {incidents.length === 0 ? (
            <Alert variant={ALERT_VARIANT.INFO} className="text-center">
              <InformationCircleIconOutline className="mr-2 w-5 h-5" />
              インシデントはまだ登録されていません
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidents.map(incident => (
                <Card
                  key={incident.registeredDate}
                  className="relative cursor-default transition-none"
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h5 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-0 line-clamp-2">
                      {incident.caseName}
                    </h5>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {incident.updateDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center mr-2">
                          <ClockIcon className="mr-0.5 w-3 h-3" />
                          {incident.updateDate}
                        </span>
                      )}
                      {incident.driveFolderUrl && (
                        <a
                          href={incident.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          title="Driveフォルダを開く"
                        >
                          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge
                      variant="primary"
                      icon={<UserIcon className="mr-1 w-4 h-4" />}
                    >
                      <span className="text-sm">{incident.assignee}</span>
                    </Badge>
                    <Badge
                      variant={
                        incident.status === INCIDENT_STATUS.IN_PROGRESS
                          ? 'warning'
                          : incident.status === INCIDENT_STATUS.REVIEW_REQUESTED
                            ? 'secondary'
                            : incident.status === INCIDENT_STATUS.REPORTED
                              ? 'info'
                              : incident.status === INCIDENT_STATUS.CLOSED
                                ? 'contrast'
                                : incident.status === INCIDENT_STATUS.REJECTED
                                  ? 'danger'
                                  : undefined
                      }
                      icon={<FlagIcon className="mr-1 w-4 h-4" />}
                    >
                      <span className="text-sm">{incident.status}</span>
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {incident.summary}
                  </p>

                  {statusChangeIncident?.registeredDate ===
                  incident.registeredDate ? (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        ステータスを変更
                      </p>
                      <div className="flex flex-col gap-2">
                        {getAllStatuses().map(status => {
                          const isDisabled =
                            isStatusUpdating ||
                            !canChangeStatus(incident.status, status, isAdmin);
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              disabled={isDisabled}
                              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                                isDisabled
                                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800'
                              }`}
                            >
                              {status}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setStatusChangeIncident(null)}
                          disabled={isStatusUpdating}
                          className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCardClick(incident)}
                        className="flex-1 px-3 py-2 text-sm rounded bg-gray-400 text-white hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => setStatusChangeIncident(incident)}
                        className="flex-1 px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                      >
                        ステータス変更
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* 確認モーダル */}
      <ConfirmEditIncidentModal
        isOpen={isConfirmOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmEdit}
        onEditSpreadsheet={handleEditSpreadsheet}
        incidentName={selectedIncident?.caseName}
      />
    </div>
  );
};

export default IncidentListPage;
