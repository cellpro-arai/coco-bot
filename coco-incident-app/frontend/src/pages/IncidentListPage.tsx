import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import * as api from '../services/apiService';
import { Badge } from '../components/common';
import styles from './IncidentListPage.module.css';
import Article, { ARTICLE_VARIANT } from '../components/Article';
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
    <div>
      {/* ツールバー */}
      <nav className="container-fluid">
        <ul>
          <li>
            <hgroup>
              <h2 className="mb-0">
                <ListUlIcon className="me-2" />
                インシデント一覧
              </h2>
            </hgroup>
          </li>
        </ul>
        <ul>
          <li>
            <button
              className="secondary"
              onClick={loadIncidents}
              disabled={loading}
            >
              <ArrowClockwiseIcon className="me-2" />
              更新
            </button>
          </li>
          <li>
            <button onClick={showForm}>
              <PlusCircleIcon className="me-2" />
              新規起票
            </button>
          </li>
        </ul>
      </nav>

      {/* ローディング */}
      {loading && (
        <article className="text-center py-5" aria-busy="true">
          <p>データを読み込んでいます...</p>
        </article>
      )}

      {/* エラー表示 */}
      {error && !loading && (
        <Article variant={ARTICLE_VARIANT.DANGER}>
          <ExclamationCircleFillIcon className="me-2" />
          <span>{error}</span>
        </Article>
      )}

      {/* カード一覧 */}
      {!loading && !error && (
        <div>
          {incidents.length === 0 ? (
            <Article variant={ARTICLE_VARIANT.INFO} className="text-center">
              <InfoCircleIcon className="me-2" />
              インシデントはまだ登録されていません
            </Article>
          ) : (
            <div className="grid">
              {incidents.map(incident => (
                <div key={incident.registeredDate} className="col">
                  <article
                    onClick={() => editIncident(incident)}
                    className={styles.incidentCard}
                  >
                    <div className={styles.cardHeader}>
                      <h5>{incident.caseName}</h5>
                      {incident.updateDate && (
                        <small className={styles.updateDate}>
                          <ClockFillIcon className="me-1" />
                          <span>{incident.updateDate}</span>
                        </small>
                      )}
                    </div>
                    <div className="mb-2">
                      <Badge
                        variant="primary"
                        icon={<PersonFillIcon className="me-1" />}
                        className="me-2"
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
                        icon={<FlagFillIcon className="me-1" />}
                        className="me-2"
                      >
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="text-truncate-2 mb-2">{incident.summary}</p>
                  </article>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IncidentListPage;
