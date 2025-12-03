import { useState } from 'react';
import { Incident } from '../types';
import Header from '../components/Header';
import IncidentListPage from './IncidentListPage';
import IncidentFormPage from './IncidentFormPage';
import useTheme from '../hooks/useTheme';
import { useViewManager, VIEW_VARIANT } from '../hooks/useViewManager';
import { Container } from '../components/ui';

function MainPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const { theme, toggleTheme } = useTheme();
  const { currentView, selectedIncident, showForm, editIncident, backToList } =
    useViewManager();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1">
        <Container>
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
        </Container>
      </main>

      <footer className="mt-auto py-4 border-t border-gray-200 bg-white">
        <Container>
          <p className="text-sm text-gray-600 text-center">
            &copy; 2025 Cell Promote Inc. (Coco Incident). All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  );
}

export default MainPage;
