import React from 'react';
import { Incident } from '../types/types';

interface IncidentListProps {
  incidents: Incident[];
  loading: boolean;
  error: string;
  loadIncidents: () => void;
  showForm: () => void;
  editIncident: (incident: Incident) => void;
}

const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  loading,
  error,
  loadIncidents,
  showForm,
  editIncident,
}) => {
  return (
    <div>
      {/* ツールバー */}
      <nav className="container-fluid">
        <ul>
          <li>
            <hgroup>
              <h2 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>インシデント一覧
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
              <i className="bi bi-arrow-clockwise me-2"></i>更新
            </button>
          </li>
          <li>
            <button onClick={showForm}>
              <i className="bi bi-plus-circle me-2"></i>新規起票
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
        <article className="danger">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          <span>{error}</span>
        </article>
      )}

      {/* カード一覧 */}
      {!loading && !error && (
        <div>
          {incidents.length === 0 ? (
            <article className="info text-center">
              <i className="bi bi-info-circle me-2"></i>
              インシデントはまだ登録されていません
            </article>
          ) : (
            <div className="grid">
              {incidents.map(incident => (
                <div key={incident.registeredDate} className="col">
                  <article onClick={() => editIncident(incident)}>
                    <div className="card-header">
                      <h5>{incident.caseName}</h5>
                      {incident.updateDate && (
                        <small className="update-date">
                          <i className="bi bi-clock-fill"></i>
                          <span>{incident.updateDate}</span>
                        </small>
                      )}
                    </div>
                    <div className="mb-2">
                      <span className="badge primary me-2">
                        <i className="bi bi-person-fill me-1"></i>
                        <span>{incident.assignee}</span>
                      </span>
                      <span
                        className={`badge me-2 ${
                          incident.status === '対応中'
                            ? 'warning'
                            : incident.status === '保留'
                              ? 'secondary'
                              : incident.status === '解決済み'
                                ? 'success'
                                : incident.status === 'クローズ'
                                  ? 'contrast'
                                  : ''
                        }`}
                      >
                        <i className="bi bi-flag-fill me-1"></i>
                        <span>{incident.status}</span>
                      </span>
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

export default IncidentList;
