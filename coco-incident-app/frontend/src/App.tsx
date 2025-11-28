import React, { useState, useEffect } from 'react';
import './app.css';
import { initialFormData } from './modules/state';
import * as api from './modules/api';
import { Incident, IncidentFormData, FileData } from './modules/types';

// Components
import Header from './components/Header';
import IncidentList from './components/IncidentList';
import IncidentForm from './components/IncidentForm';
import SuccessModal from './components/SuccessModal';

function App() {
  // State management
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(
    null
  );
  const [formData, setFormData] = useState<IncidentFormData>({
    ...initialFormData,
  });
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );

  // Initialize app
  useEffect(() => {
    applyTheme();
    loadIncidents();
  }, []);

  // Apply theme
  useEffect(() => {
    applyTheme();
  }, [theme]);

  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', theme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

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

  const showForm = () => {
    resetForm();
    setCurrentView('form');
  };

  const editIncident = (incident: Incident) => {
    resetForm();
    setSelectedIncident(incident);
    setFormData({
      registeredDate: incident.registeredDate,
      caseName: incident.caseName,
      assignee: incident.assignee,
      status: incident.status,
      summary: incident.summary || '',
      stakeholders: incident.stakeholders || '',
      details: incident.details || '',
      fileDataList: [],
    });
    setCurrentView('form');
  };

  const backToList = () => {
    setCurrentView('list');
    setSelectedIncident(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ ...initialFormData });
    setSelectedIncident(null);
    setError('');
    setSubmittedIncident(null);
    setShowSuccessModal(false);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.caseName || !formData.assignee || !formData.summary) {
      setError('必須項目を入力してください');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await api.submitIncident(formData);
      const isUpdate = !!(
        formData.registeredDate && formData.registeredDate.trim()
      );

      const submittedIncidentData: Incident = {
        ...result.record,
        summary: formData.summary,
        stakeholders: formData.stakeholders,
        details: formData.details,
        improvementSuggestions: result.improvementSuggestions || '',
      };

      if (isUpdate) {
        setIncidents((prev: Incident[]) =>
          prev.map((inc: Incident) =>
            inc.registeredDate === formData.registeredDate
              ? submittedIncidentData
              : inc
          )
        );
      } else {
        setIncidents((prev: Incident[]) => [submittedIncidentData, ...prev]);
      }

      setSubmittedIncident(submittedIncidentData);
      setShowSuccessModal(true);
    } catch (error: any) {
      setError(error.message || '送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    backToList();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileDataList: FileData[] = [];
    let filesProcessed = 0;

    Array.from(files as FileList).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          const base64Data = (e.target.result as string).split(',')[1];
          fileDataList.push({
            name: file.name,
            mimeType: file.type,
            data: base64Data,
          });
        }
        filesProcessed++;
        if (filesProcessed === files.length) {
          setFormData((prev: IncidentFormData) => ({ ...prev, fileDataList }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFormData((prev: IncidentFormData) => ({
      ...prev,
      fileDataList: prev.fileDataList.filter(
        (_: FileData, i: number) => i !== index
      ),
    }));
  };

  return (
    <div id="app-wrapper">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="container">
        {currentView === 'list' && (
          <IncidentList
            incidents={incidents}
            loading={loading}
            error={error}
            loadIncidents={loadIncidents}
            showForm={showForm}
            editIncident={editIncident}
          />
        )}

        {currentView === 'form' && (
          <IncidentForm
            formData={formData}
            setFormData={setFormData}
            selectedIncident={selectedIncident}
            error={error}
            submitting={submitting}
            submitForm={submitForm}
            backToList={backToList}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
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

export default App;
