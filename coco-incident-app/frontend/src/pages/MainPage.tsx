import { useState } from 'react';
import '../app.css';
import { Incident } from '../modules/types';

import Header from '../components/Header';
import IncidentListPage from './IncidentListPage';
import IncidentFormPage from './IncidentFormPage';
import SuccessModal from '../components/SuccessModal';
import useTheme from '../hooks/useTheme';

function MainPage() {
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(
    null
  );
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );

  // useTheme hook
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

  const handleFormSuccess = (incident: Incident) => {
    setSubmittedIncident(incident);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    backToList();
  };

  return (
    <div id="app-wrapper">
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
            onSuccess={handleFormSuccess}
            backToList={backToList}
          />
        )}
      </main>

      {showSuccessModal && submittedIncident && (
        <SuccessModal
          submittedIncident={submittedIncident}
          closeSuccessModal={closeSuccessModal}
        />
      )}

      <footer className="container">
        <small>
          &copy; 2025 Cell Promote Inc. (Coco Incident). All rights reserved.
        </small>
      </footer>
    </div>
  );
}

export default MainPage;
