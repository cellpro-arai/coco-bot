import { useState, useEffect } from 'react';
import { Incident, USER_ROLE, UserPermission } from '../types';
import { Header, Container } from '../components/layouts';
import IncidentListPage from './IncidentListPage';
import IncidentFormPage from './IncidentFormPage';
import PermissionManagementPage from './PermissionManagementPage';
import useTheme from '../hooks/useTheme';
import { useViewManager, VIEW_VARIANT } from '../hooks/useViewManager';
import { getInitialData } from '../services/permissionService';

function MainPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [uploadFolderUrl, setUploadFolderUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const {
    currentView,
    selectedIncident,
    showForm,
    editIncident,
    backToList,
    showPermissionManagement,
  } = useViewManager();

  // 初期化時に全データを一括取得
  const fetchData = async (setLoading: (value: boolean) => void) => {
    try {
      setPermissionError(null);

      // 初期データを一括取得（ユーザー権限、インシデント、アップロードフォルダURL）
      const initialData = await getInitialData();

      setPermissions(initialData.users);
      setIncidents(initialData.incidents);
      setUploadFolderUrl(initialData.upload_folder_url);

      // バックエンドから返される role で管理者かどうかを判定
      setIsAdmin(initialData.role === USER_ROLE.ADMIN);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラーが発生しました';
      console.error('データの取得に失敗:', error);
      setPermissionError(errorMessage);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(setLoadingPermissions);
  }, []);

  const handleAddUser = (newUser: UserPermission) => {
    setPermissions([...permissions, newUser]);
  };

  const handleRemoveUser = (email: string) => {
    setPermissions(permissions.filter(p => p.email !== email));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(setIsRefreshing);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-200 dark:bg-gray-900">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1">
        <Container fluid>
          {permissionError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-semibold">権限エラー</p>
              <p className="text-sm mt-2">{permissionError}</p>
            </div>
          )}

          {currentView === VIEW_VARIANT.LIST && (
            <IncidentListPage
              incidents={incidents}
              uploadFolderUrl={uploadFolderUrl}
              showForm={showForm}
              editIncident={editIncident}
              showPermissionManagement={
                isAdmin ? showPermissionManagement : undefined
              }
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              isAdmin={isAdmin}
            />
          )}

          {currentView === VIEW_VARIANT.FORM && (
            <IncidentFormPage
              selectedIncident={selectedIncident}
              setIncidents={setIncidents}
              backToList={backToList}
              isAdmin={isAdmin}
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
