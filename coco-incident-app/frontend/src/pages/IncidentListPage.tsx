import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import * as api from '../services/incidentService';
import { Button, Card, Badge, Alert, ALERT_VARIANT } from '../components/ui';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FlagIcon,
  InformationCircleIconOutline,
  ListBulletIcon,
  UserIcon,
  PlusCircleIcon,
  UsersIcon,
} from '../components/icons';
import { INCIDENT_STATUS } from '../types/constants';

interface IncidentListPageProps {
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  showForm: () => void;
  editIncident: (incident: Incident) => void;
  showPermissionManagement?: () => void;
}

const IncidentListPage: React.FC<IncidentListPageProps> = ({
  incidents,
  setIncidents,
  showForm,
  editIncident,
  showPermissionManagement,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadFolderUrl, setUploadFolderUrl] = useState('');

  useEffect(() => {
    if (incidents.length === 0) {
      loadIncidents();
    }
    loadUploadFolderUrl();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getIncidentList();
      setIncidents(data);
    } catch (error: any) {
      setError(error.message || 'データの読み込みに失敗しました');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUploadFolderUrl = async () => {
    try {
      const url = await api.getUploadFolderUrl();
      setUploadFolderUrl(url);
    } catch (error: any) {
      console.error('フォルダURLの取得に失敗:', error);
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
              <Button variant="secondary" onClick={showPermissionManagement}>
                <UsersIcon className="mr-2 w-4 h-4" />
                権限管理
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={loadIncidents}
              disabled={loading}
            >
              <ArrowPathIcon className="w-4 h-4" />
            </Button>
            <Button onClick={showForm}>
              <PlusCircleIcon className="mr-2 w-4 h-4" />
              新規
            </Button>
          </div>
        </div>
      </div>

      {/* ローディング */}
      {loading && (
        <Card className="text-center py-12">
          <div className="animate-pulse">
            <p className="text-gray-600 dark:text-gray-400">
              データを読み込んでいます...
            </p>
          </div>
        </Card>
      )}

      {/* エラー表示 */}
      {error && !loading && (
        <Alert variant={ALERT_VARIANT.DANGER} className="flex items-center">
          <ExclamationCircleIcon className="mr-2 w-5 h-5" />
          <span>{error}</span>
        </Alert>
      )}

      {/* カード一覧 */}
      {!loading && !error && (
        <div>
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
        </div>
      )}
    </div>
  );
};

export default IncidentListPage;
