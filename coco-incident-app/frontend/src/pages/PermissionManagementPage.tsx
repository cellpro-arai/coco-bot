import { useState } from 'react';
import { UserPermission } from '../types';
import {
  Button,
  Alert,
  ALERT_VARIANT,
  FormLabel,
  FormEmailInput,
  FormSelect,
} from '../components/ui';
import { addUser, removeUser } from '../services/apiService';
import {
  ArrowLeftIcon,
  UsersIcon,
  UserIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
} from '../components/icons';

interface FormState {
  email: string;
  role: 'admin' | 'user';
}

interface PermissionManagementPageProps {
  permissions: UserPermission[];
  onAddUser: (newUser: UserPermission) => void;
  onRemoveUser: (email: string) => void;
  backToList: () => void;
  loading?: boolean;
}

function PermissionManagementPage({
  permissions,
  onAddUser,
  onRemoveUser,
  backToList,
  loading = false,
}: PermissionManagementPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    email: '',
    role: 'user',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formState.email.trim()) {
      setError('メールアドレスを入力してください。');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // メールアドレスに@がない場合は@以下を追加
      const finalEmail = formState.email.includes('@')
        ? formState.email
        : `${formState.email}@cellpromote.biz`;

      // ユーザーを追加
      const newUser = await addUser(finalEmail, formState.role);

      // 状態を更新（再取得しない）
      onAddUser(newUser);

      // フォームをリセット
      setFormState({ email: '', role: 'user' });

      setSuccess('ユーザーを追加しました。');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm(`${email} を削除しますか？`)) {
      return;
    }

    try {
      setDeleting(email);
      setError(null);
      setSuccess(null);

      // ユーザーを削除
      await removeUser(email);

      // 状態を更新（再取得しない）
      onRemoveUser(email);

      setSuccess('ユーザーを削除しました。');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <UsersIcon className="mr-2 w-8 h-8 flex-shrink-0" />
          権限管理
        </h1>
        <Button variant="secondary" onClick={backToList}>
          <ArrowLeftIcon className="mr-2 w-4 h-4" />
          一覧に戻る
        </Button>
      </div>

      <div className="space-y-6">
        {error && <Alert variant={ALERT_VARIANT.DANGER}>{error}</Alert>}
        {success && <Alert variant={ALERT_VARIANT.SUCCESS}>{success}</Alert>}

        {/* 新規ユーザー登録フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserIcon className="mr-2 w-5 h-5" />
            ユーザーを追加
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FormLabel
                htmlFor="email"
                required
                icon={<EnvelopeIcon className="text-blue-600 w-4 h-4" />}
              >
                メールアドレス
              </FormLabel>
              <FormEmailInput
                id="email"
                value={formState.email}
                onChange={e =>
                  setFormState({ ...formState, email: e.target.value })
                }
                placeholder="username"
                domain="cellpromote.biz"
                required
              />
            </div>

            <div>
              <FormLabel
                htmlFor="role"
                required
                icon={<ShieldCheckIcon className="text-blue-600 w-4 h-4" />}
              >
                ロール
              </FormLabel>
              <FormSelect
                id="role"
                value={formState.role}
                onChange={e =>
                  setFormState({
                    ...formState,
                    role: e.target.value as 'admin' | 'user',
                  })
                }
              >
                <option value="user">ユーザー</option>
                <option value="admin">管理者</option>
              </FormSelect>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting || loading}
              className="w-full"
            >
              {submitting ? '追加中...' : '追加'}
            </Button>
          </form>
        </div>

        {/* ユーザー一覧テーブル */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white p-6 border-b border-gray-200 dark:border-gray-700 flex items-center">
            <UsersIcon className="mr-2 w-5 h-5" />
            ユーザー一覧
          </h2>

          {loading ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              読み込み中...
            </div>
          ) : permissions.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              登録されているユーザーはありません。
            </div>
          ) : (
            <>
              {/* Desktop Table - hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
                          メールアドレス
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
                          ロール
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Slack User ID
                      </th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-900 dark:text-white">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map(permission => (
                      <tr
                        key={permission.email}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-300">
                          {permission.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                              permission.role === 'admin'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}
                          >
                            <ShieldCheckIcon className="w-3 h-3" />
                            {permission.role === 'admin'
                              ? '管理者'
                              : 'ユーザー'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs break-all">
                          {permission.slackUserId}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <Button
                            variant="outline"
                            onClick={() => handleDelete(permission.email)}
                            disabled={
                              deleting === permission.email ||
                              loading ||
                              submitting
                            }
                            className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            {deleting === permission.email
                              ? '削除中...'
                              : '削除'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - shown on mobile */}
              <div className="md:hidden space-y-4 p-4 bg-gray-50 dark:bg-gray-700/30">
                {permissions.map(permission => (
                  <div
                    key={permission.email}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-700 space-y-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        メールアドレス
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 break-all">
                        {permission.email}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                          <ShieldCheckIcon className="w-3 h-3" />
                          ロール
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                            permission.role === 'admin'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          <ShieldCheckIcon className="w-3 h-3" />
                          {permission.role === 'admin' ? '管理者' : 'ユーザー'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Slack ID
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                          {permission.slackUserId}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handleDelete(permission.email)}
                      disabled={
                        deleting === permission.email || loading || submitting
                      }
                      className="w-full text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                    >
                      {deleting === permission.email ? '削除中...' : '削除'}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PermissionManagementPage;
