import { useState, useEffect } from 'react';
import { Incident, UserPermission } from '../types';
import { Header, Container } from '../components/layouts';
import IncidentListPage from './IncidentListPage';
import IncidentFormPage from './IncidentFormPage';
import PermissionManagementPage from './PermissionManagementPage';
import useTheme from '../hooks/useTheme';
import { useViewManager, VIEW_VARIANT } from '../hooks/useViewManager';
import { getAllPermissions, getCurrentUserEmail } from '../services/apiService';

function MainPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const {
    currentView,
    selectedIncident,
    showForm,
    editIncident,
    backToList,
    showPermissionManagement,
  } = useViewManager();

  // 初期化時に権限情報と管理者フラグを取得
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        // すべての権限一覧を取得
        const perms = await getAllPermissions();
        setPermissions(perms);

        // 現在のユーザーのメールアドレスを取得
        const currentUserEmail = await getCurrentUserEmail();

        // 管理者かどうかを判定
        const isUserAdmin = perms.some(
          p => p.email === currentUserEmail && p.role === 'admin'
        );
        setIsAdmin(isUserAdmin);
      } catch (error) {
        console.error('権限情報の初期化に失敗:', error);
      } finally {
        setLoadingPermissions(false);
      }
    };

    initializePermissions();
  }, []);

  const handleAddUser = (newUser: UserPermission) => {
    setPermissions([...permissions, newUser]);
  };

  const handleRemoveUser = (email: string) => {
    setPermissions(permissions.filter(p => p.email !== email));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-200 dark:bg-gray-900">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1">
        <Container fluid>
          {currentView === VIEW_VARIANT.LIST && (
            <IncidentListPage
              incidents={incidents}
              setIncidents={setIncidents}
              showForm={showForm}
              editIncident={editIncident}
              showPermissionManagement={
                isAdmin ? showPermissionManagement : undefined
              }
            />
          )}

          {currentView === VIEW_VARIANT.FORM && (
            <IncidentFormPage
              selectedIncident={selectedIncident}
              setIncidents={setIncidents}
              backToList={backToList}
            />
          )}

          {currentView === VIEW_VARIANT.PERMISSION && (
            <PermissionManagementPage
              permissions={permissions}
              onAddUser={handleAddUser}
              onRemoveUser={handleRemoveUser}
              backToList={backToList}
              loading={loadingPermissions}
            />
          )}
        </Container>
      </main>

      <footer className="mt-auto py-4 border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <Container fluid>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            &copy; 2025 Cell Promote Inc. (Coco Incident). All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  );
}

export default MainPage;
