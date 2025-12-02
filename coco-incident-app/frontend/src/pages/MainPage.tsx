import { useState } from 'react';
import '../app.css';
import { Incident } from '../types';

import Header from '../components/Header';
import IncidentListPage from './IncidentListPage';
import IncidentFormPage from './IncidentFormPage';
import useTheme from '../hooks/useTheme';
import styles from './MainPage.module.css';

function MainPage() {
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );

  const { theme, toggleTheme } = useTheme();

  const showForm = () => {
    setSelectedIncident(null);
    setCurrentView('form');
  };

  const editIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setCurrentView('form');
  };

  const backToList = () => {
    setCurrentView('list');
    setSelectedIncident(null);
  };

  return (
    <div id="app-wrapper" className={styles.appWrapper}>
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="container">
        {currentView === 'list' && (
          <IncidentListPage
            incidents={incidents}
            setIncidents={setIncidents}
            showForm={showForm}
            editIncident={editIncident}
          />
        )}

        {currentView === 'form' && (
          <IncidentFormPage
            selectedIncident={selectedIncident}
            setIncidents={setIncidents}
            backToList={backToList}
          />
        )}
      </main>

      <footer className="container">
        <small>
          &copy; 2025 Cell Promote Inc. (Coco Incident). All rights reserved.
        </small>
      </footer>
    </div>
  );
}

export default MainPage;
