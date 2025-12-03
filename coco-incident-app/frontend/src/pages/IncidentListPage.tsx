import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import * as api from '../services/apiService';
import { Button, Card, Badge, Alert, ALERT_VARIANT } from '../components/ui';
import {
  ArrowClockwiseIcon,
  ClockFillIcon,
  ExclamationCircleFillIcon,
  FlagFillIcon,
  InfoCircleIcon,
  ListUlIcon,
  PersonFillIcon,
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
    <div className="py-4">
      {/* ツールバー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center mb-0">
          <ListUlIcon className="mr-2" />
          インシデント一覧
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={loadIncidents}
            disabled={loading}
          >
            <ArrowClockwiseIcon className="mr-2" />
            更新
          </Button>
          <Button onClick={showForm}>
            <PlusCircleIcon className="mr-2" />
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
          <ExclamationCircleFillIcon className="mr-2" />
          <span>{error}</span>
        </Alert>
      )}

      {/* カード一覧 */}
      {!loading && !error && (
        <div>
          {incidents.length === 0 ? (
            <Alert variant={ALERT_VARIANT.INFO} className="text-center">
              <InfoCircleIcon className="mr-2" />
              インシデントはまだ登録されていません
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidents.map(incident => (
                <Card
                  key={incident.registeredDate}
                  onClick={() => editIncident(incident)}
                  className="h-full cursor-pointer transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 !p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0">
                      {incident.caseName}
                    </h5>
                    {incident.updateDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4 flex items-center">
                        <ClockFillIcon className="mr-1 w-3 h-3" />
                        {incident.updateDate}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge
                      variant="primary"
                      icon={<PersonFillIcon className="mr-1 w-4 h-4" />}
                    >
                      {incident.assignee}
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
                      icon={<FlagFillIcon className="mr-1 w-4 h-4" />}
                    >
                      {incident.status}
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
