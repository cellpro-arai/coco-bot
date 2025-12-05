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
import { INCIDENT_STATUS } from '../types/constants';

interface IncidentListPageProps {
  incidents: Incident[];
  uploadFolderUrl: string;
  showForm: () => void;
  editIncident: (incident: Incident) => void;
  showPermissionManagement?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const IncidentListPage: React.FC<IncidentListPageProps> = ({
  incidents,
  uploadFolderUrl,
  showForm,
  editIncident,
  showPermissionManagement,
  onRefresh,
  isRefreshing = false,
}) => {
  // uploadFolderUrl が空の場合はローディング状態
  const isLoading = !uploadFolderUrl;

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
                  onClick={() => editIncident(incident)}
                  className="relative"
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
                          onClick={e => e.stopPropagation()}
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
                  <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300 mb-0">
                    {incident.summary}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IncidentListPage;
