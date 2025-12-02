import { useState } from 'react';
import '../app.css';
import { Incident } from '../types';
import Header from '../components/Header';
import IncidentListPage from './IncidentListPage';
import IncidentFormPage from './IncidentFormPage';
import useTheme from '../hooks/useTheme';
import { useViewManager, VIEW_VARIANT } from '../hooks/useViewManager';
import styles from './MainPage.module.css';

function MainPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const { theme, toggleTheme } = useTheme();
  const { currentView, selectedIncident, showForm, editIncident, backToList } =
    useViewManager();

  return (
    <div id="app-wrapper" className={styles.appWrapper}>
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="container">
        {currentView === VIEW_VARIANT.LIST && (
          <IncidentListPage
            incidents={incidents}
            setIncidents={setIncidents}
            showForm={showForm}
            editIncident={editIncident}
          />
        )}

        {currentView === VIEW_VARIANT.FORM && (
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
