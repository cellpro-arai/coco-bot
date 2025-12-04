import React, { useState } from 'react';
import {
  Incident,
  IncidentFormData,
  FileData,
  AI_ANALYSIS_STATUS,
  PLACEHOLDERS,
  INCIDENT_STATUS,
} from '../types';
import * as api from '../services/apiService';
import { SuccessModal } from '../components/modals';
import {
  Button,
  Card,
  Alert,
  ALERT_VARIANT,
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormHelperText,
  AppLink,
} from '../components/ui';
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ClockIconOutline,
  ArrowTopRightOnSquareIcon,
  CpuChipIcon,
  FolderIcon,
  UserIcon,
  FlagIcon,
  PencilSquareIcon,
  UsersIcon,
  DocumentTextIcon,
  PaperClipIcon,
  FolderOpenIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from '../components/icons';

interface IncidentFormPageProps {
  selectedIncident: Incident | null;
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  backToList: () => void;
}

const IncidentFormPage: React.FC<IncidentFormPageProps> = ({
  selectedIncident,
  setIncidents,
  backToList,
}) => {
  const [formData, setFormData] = useState<IncidentFormData>({
    registeredDate: selectedIncident?.registeredDate || '',
    caseName: selectedIncident?.caseName || '',
    assignee: selectedIncident?.assignee || '',
    status: selectedIncident?.status || INCIDENT_STATUS.REPORTED,
    summary: selectedIncident?.summary || '',
    stakeholders: selectedIncident?.stakeholders || '',
    details: selectedIncident?.details || '',
    fileDataList: [],
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(
    null
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
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

  return (
    <div className="py-4">
      {/* 戻るボタン */}
      <Button variant="secondary" onClick={backToList} className="mb-4">
        <ArrowLeftIcon className="mr-2 w-5 h-5" />
        一覧へ戻る
      </Button>

      {/* フォームカード */}
      <Card>
        {/* エラー表示 */}
        {error && (
          <Alert
            variant={ALERT_VARIANT.DANGER}
            className="flex items-center mb-6"
            role="alert"
          >
            <ExclamationCircleIcon className="mr-2 w-5 h-5" />
            <span>{error}</span>
          </Alert>
        )}

        {/* 重要な注意事項 */}
        <Alert variant={ALERT_VARIANT.WARNING} className="mb-6" role="alert">
          <h6 className="flex items-center mb-3">
            <InformationCircleIcon className="mr-2 w-5 h-5" />
            重要な注意事項
          </h6>
          <ul className="mb-0">
            <li>すべての情報をできるだけ詳細に記入してください</li>
            <li>些細な情報でも省略せず、すべて記載してください</li>
            <li>情報の加工や省略は行わないでください</li>
            <li>わかる範囲ですべての関係者を記載してください</li>
          </ul>
        </Alert>

        {/* AI解析待ち表示（編集モード時のみ） */}
        {formData.registeredDate &&
          selectedIncident &&
          selectedIncident.aiAnalysisStatus === AI_ANALYSIS_STATUS.PENDING && (
            <Alert variant={ALERT_VARIANT.WARNING} className="mb-4 sm:mb-6">
              <h6 className="flex items-center text-sm sm:text-base font-semibold mb-2 sm:mb-3">
                <ClockIconOutline className="mr-2 w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                AI解析待ち
              </h6>
              <p className="mb-1 sm:mb-2 text-xs sm:text-sm">
                このインシデントはAI解析がまだ完了していません。
              </p>
              <p className="mb-2 sm:mb-4 text-xs sm:text-sm">
                詳細スプレッドシートを開いて、セルB5のAI数式を手動で更新してください。
              </p>
              <AppLink
                href={selectedIncident.incidentDetailUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline={false}
                className="inline-flex items-center text-xs sm:text-sm"
              >
                <ArrowTopRightOnSquareIcon className="mr-1 w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                詳細スプレッドシートを開く
              </AppLink>
            </Alert>
          )}

        {/* AI解析結果表示（編集モード時のみ） */}
        {formData.registeredDate &&
          selectedIncident &&
          selectedIncident.aiAnalysisStatus === AI_ANALYSIS_STATUS.COMPLETED &&
          selectedIncident.aiAnalysis && (
            <Alert variant={ALERT_VARIANT.INFO} className="mb-4 sm:mb-6">
              <h6 className="flex items-center text-sm sm:text-base font-semibold mb-2 sm:mb-3">
                <CpuChipIcon className="mr-2 w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                AI解析結果
              </h6>
              <div className="whitespace-pre-wrap text-xs sm:text-sm overflow-auto max-h-96">
                {selectedIncident.aiAnalysis}
              </div>
            </Alert>
          )}

        {/* フォーム */}
        <form onSubmit={submitForm}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            {/* 案件名 */}
            <FormGroup>
              <FormLabel
                htmlFor="caseName"
                required
                icon={<FolderIcon className="text-blue-600 w-3 sm:w-4 h-3 sm:h-4" />}
              >
                案件名
              </FormLabel>
              <FormInput
                type="text"
                id="caseName"
                value={formData.caseName}
                onChange={handleInputChange}
                required
                placeholder="例: 〇〇システム障害"
                className="text-sm"
              />
              <FormHelperText>
                案件を識別できる名前を記入してください
              </FormHelperText>
            </FormGroup>

            {/* 担当者 */}
            <FormGroup>
              <FormLabel
                htmlFor="assignee"
                required
                icon={<UserIcon className="text-blue-600 w-3 sm:w-4 h-3 sm:h-4" />}
              >
                担当者
              </FormLabel>
              <FormInput
                type="text"
                id="assignee"
                value={formData.assignee}
                onChange={handleInputChange}
                required
                placeholder="例: 山田太郎"
                className="text-sm"
              />
              <FormHelperText>
                このインシデントを担当する方の名前を1名記入してください
              </FormHelperText>
            </FormGroup>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            {/* ステータス */}
            <FormGroup>
              <FormLabel
                htmlFor="status"
                required
                icon={<FlagIcon className="text-blue-600 w-4 h-4" />}
              >
                ステータス
              </FormLabel>
              <FormSelect
                id="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value={INCIDENT_STATUS.REPORTED}>
                  {INCIDENT_STATUS.REPORTED}
                </option>
                <option value={INCIDENT_STATUS.REVIEW_REQUESTED}>
                  {INCIDENT_STATUS.REVIEW_REQUESTED}
                </option>
                <option value={INCIDENT_STATUS.REJECTED}>
                  {INCIDENT_STATUS.REJECTED}
                </option>
                <option value={INCIDENT_STATUS.IN_PROGRESS}>
                  {INCIDENT_STATUS.IN_PROGRESS}
                </option>
                <option value={INCIDENT_STATUS.CLOSED}>
                  {INCIDENT_STATUS.CLOSED}
                </option>
              </FormSelect>
              <FormHelperText>現在の対応状況を選択してください</FormHelperText>
            </FormGroup>

            {/* トラブル概要 */}
            <FormGroup>
              <FormLabel
                htmlFor="summary"
                required
                icon={<PencilSquareIcon className="text-blue-600 w-4 h-4" />}
              >
                トラブル概要
              </FormLabel>
              <FormTextarea
                id="summary"
                value={formData.summary}
                onChange={handleInputChange}
                rows={3}
                required
                placeholder="例: サーバーがダウンし、サービスにアクセスできない状態が発生しました"
              />
              <FormHelperText>
                トラブルの概要を簡潔に記入してください
              </FormHelperText>
            </FormGroup>
          </div>
          {/* ステークホルダー */}
          <FormGroup>
            <FormLabel
              htmlFor="stakeholders"
              required
              icon={<UsersIcon className="text-blue-600 w-4 h-4" />}
            >
              ステークホルダー
            </FormLabel>
            <FormTextarea
              id="stakeholders"
              value={formData.stakeholders}
              onChange={handleInputChange}
              rows={5}
              required
              placeholder={PLACEHOLDERS.STAKEHOLDER}
            />
            <FormHelperText>
              <strong>関係するすべての人物を記載してください：</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>顧客・クライアント</li>
                <li>社内関係者（上司、同僚、他部署など）</li>
                <li>外部ベンダー・協力会社</li>
                <li>その他関係者</li>
              </ul>
              些細な関わりでも、名前がわかる人は全員記載してください
            </FormHelperText>
          </FormGroup>
          {/* トラブル詳細 */}
          <FormGroup>
            <FormLabel
              htmlFor="details"
              required
              icon={<DocumentTextIcon className="text-blue-600 w-4 h-4" />}
            >
              トラブル詳細
            </FormLabel>
            <FormTextarea
              id="details"
              value={formData.details}
              onChange={handleInputChange}
              rows={10}
              required
              placeholder={PLACEHOLDERS.TROUBLE_DETAIL}
            />
            <FormHelperText>
              <strong>以下の情報をできるだけ詳しく記載してください：</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>発生日時・発覚の経緯</li>
                <li>具体的な現象・症状</li>
                <li>影響範囲（ユーザー数、システム範囲など）</li>
                <li>対応状況・時系列</li>
                <li>原因と思われる事項</li>
                <li>過去の類似事例</li>
                <li>その他気づいた点すべて</li>
              </ul>
            </FormHelperText>
          </FormGroup>
          <hr className="my-6 border-gray-200 dark:border-gray-700" />
          {/* 既存の添付ファイル（編集モード時） */}
          {formData.registeredDate &&
            selectedIncident &&
            selectedIncident.attachments &&
            selectedIncident.attachments.trim() && (
              <FormGroup>
                <FormLabel
                  htmlFor=""
                  icon={<PaperClipIcon className="text-blue-600 w-4 h-4" />}
                >
                  既存の添付ファイル
                </FormLabel>
                <Alert variant={ALERT_VARIANT.INFO}>
                  <div className="text-sm whitespace-pre-wrap">
                    {selectedIncident.attachments}
                  </div>
                  {selectedIncident.driveFolderUrl && (
                    <div className="mt-3">
                      <AppLink
                        href={selectedIncident.driveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline={false}
                        className="inline-flex items-center"
                      >
                        <FolderOpenIcon className="mr-1 w-4 h-4" />
                        Driveフォルダを開く
                      </AppLink>
                    </div>
                  )}
                </Alert>
              </FormGroup>
            )}{' '}
          {/* 関連ファイル */}
          <FormGroup>
            <FormLabel
              htmlFor="fileUpload"
              icon={<CloudArrowUpIcon className="text-blue-600 w-4 h-4" />}
            >
              {formData.registeredDate
                ? '追加ファイルのアップロード'
                : '関連ファイルのアップロード'}
            </FormLabel>
            <FormInput
              type="file"
              id="fileUpload"
              onChange={handleFileUpload}
              multiple
            />
            <FormHelperText>
              {formData.registeredDate
                ? '新しくファイルを追加する場合は選択してください（複数選択可能）'
                : 'メールのやり取り、契約書類、スクリーンショット、動画などをアップロードできます（複数選択可能）'}
            </FormHelperText>
          </FormGroup>
          {/* 選択されたファイルリスト */}
          {formData.fileDataList && formData.fileDataList.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                選択されたファイル:
              </p>
              <ul className="space-y-2">
                {formData.fileDataList.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeFile(index)}
                      className="!px-2 !py-1"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <hr className="my-6 border-gray-200 dark:border-gray-700" />
          {/* 送信ボタン */}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <ArrowPathIcon className="mr-2 animate-spin w-4 h-4" />
                <span>
                  {formData.registeredDate ? '更新中...' : '送信中...'}
                </span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="mr-2 w-4 h-4" />
                <span>{formData.registeredDate ? '更新する' : '登録する'}</span>
              </>
            )}
          </Button>
        </form>
      </Card>

      {showSuccessModal && submittedIncident && (
        <SuccessModal
          submittedIncident={submittedIncident}
          closeSuccessModal={closeSuccessModal}
        />
      )}
    </div>
  );
};

export default IncidentFormPage;
