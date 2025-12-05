import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import * as api from '../services/apiService';
import { Button, Card, Badge, Alert, ALERT_VARIANT } from '../components/ui';
import {
  ArrowPathIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FlagIcon,
  InformationCircleIconOutline,
  ListBulletIcon,
  UserIcon,
  PlusCircleIcon,
} from '../components/icons';

interface IncidentListPageProps {
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  showForm: () => void;
  editIncident: (incident: Incident) => void;
}

const IncidentListPage: React.FC<IncidentListPageProps> = ({
  incidents,
  setIncidents,
  showForm,
  editIncident,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (incidents.length === 0) {
      loadIncidents();
    }
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

  return (
    <div className="py-2 sm:py-4">
      {/* ツールバー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center mb-0">
          <ListBulletIcon className="mr-2 w-6 sm:w-10 h-6 sm:h-10 flex-shrink-0" />
          インシデント一覧
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={loadIncidents}
            disabled={loading}
            className="text-xs sm:text-base !px-3 sm:!px-4 !py-2 sm:!py-2.5 min-h-9 sm:min-h-10"
          >
            <ArrowPathIcon className="mr-1 sm:mr-2 w-4 h-4 sm:w-4 sm:h-4" />
            更新
          </Button>
          <Button
            onClick={showForm}
            className="text-xs sm:text-base !px-3 sm:!px-4 !py-2 sm:!py-2.5 min-h-9 sm:min-h-10"
          >
            <PlusCircleIcon className="mr-1 sm:mr-2 w-4 h-4 sm:w-4 sm:h-4" />
            新規起票
          </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {incidents.map(incident => (
                <Card
                  key={incident.registeredDate}
                  onClick={() => editIncident(incident)}
                  className="h-full !p-3 sm:!p-4"
                >
                  <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                    <h5 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0 line-clamp-2">
                      {incident.caseName}
                    </h5>
                    {incident.updateDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0 flex items-center">
                        <ClockIcon className="mr-0.5 w-3 h-3" />
                        {incident.updateDate}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <Badge
                      variant="primary"
                      icon={<UserIcon className="mr-1 w-3 sm:w-4 h-3 sm:h-4" />}
                    >
                      <span className="text-xs sm:text-sm">
                        {incident.assignee}
                      </span>
                    </Badge>
                    <Badge
                      variant={
                        incident.status === '対応中'
                          ? 'warning'
                          : incident.status === '保留'
                            ? 'secondary'
                            : incident.status === '解決済み'
                              ? 'success'
                              : incident.status === 'クローズ'
                                ? 'contrast'
                                : undefined
                      }
                      icon={<FlagIcon className="mr-1 w-3 sm:w-4 h-3 sm:h-4" />}
                    >
                      <span className="text-xs sm:text-sm">
                        {incident.status}
                      </span>
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-0">
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
