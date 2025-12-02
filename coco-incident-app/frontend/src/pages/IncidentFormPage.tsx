import React, { useState } from 'react';
import {
  Incident,
  IncidentFormData,
  FileData,
  AI_ANALYSIS_STATUS,
  PLACEHOLDERS,
} from '../types';
import * as api from '../services/apiService';
import SuccessModal from '../components/SuccessModal';
import styles from './IncidentFormPage.module.css';
import Article, { ARTICLE_VARIANT } from '../components/Article';
import {
  ArrowLeftIcon,
  ExclamationCircleFillIcon,
  InfoCircleFillIcon,
  HourglassSplitIcon,
  BoxArrowUpRightIcon,
  RobotIcon,
  FolderFillIcon,
  PersonFillIcon,
  FlagFillIcon,
  CardTextIcon,
  PeopleFillIcon,
  FileTextFillIcon,
  PaperclipIcon,
  Folder2OpenIcon,
  CloudUploadIcon,
  XIcon,
  ArrowClockwiseIcon,
  CheckCircleFillIcon,
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
    status: selectedIncident?.status || '対応中',
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
    <div>
      {/* 戻るボタン */}
      <button className="secondary" onClick={backToList}>
        <ArrowLeftIcon />
        一覧へ戻る
      </button>

      {/* フォームカード */}
      <article className="p-4">
        {/* エラー表示 */}
        {error && (
          <Article
            variant={ARTICLE_VARIANT.DANGER}
            className="d-flex align-items-center mb-4"
            role="alert"
          >
            <ExclamationCircleFillIcon className="me-2" />
            <span>{error}</span>
          </Article>
        )}

        {/* 重要な注意事項 */}
        <Article
          variant={ARTICLE_VARIANT.WARNING}
          className="mb-4"
          role="alert"
        >
          <h6 className="d-flex align-items-center mb-3">
            <InfoCircleFillIcon className="me-2" />
            重要な注意事項
          </h6>
          <ul className="mb-0">
            <li>すべての情報をできるだけ詳細に記入してください</li>
            <li>些細な情報でも省略せず、すべて記載してください</li>
            <li>情報の加工や省略は行わないでください</li>
            <li>わかる範囲ですべての関係者を記載してください</li>
          </ul>
        </Article>

        {/* AI解析待ち表示（編集モード時のみ） */}
        {formData.registeredDate &&
          selectedIncident &&
          selectedIncident.aiAnalysisStatus === AI_ANALYSIS_STATUS.PENDING && (
            <Article variant={ARTICLE_VARIANT.WARNING} className="mb-4">
              <header>
                <h6 className="mb-0">
                  <HourglassSplitIcon className="me-2" />
                  AI解析待ち
                </h6>
              </header>
              <div>
                <p className="mb-2">
                  このインシデントはAI解析がまだ完了していません。
                </p>
                <p className="mb-3">
                  詳細スプレッドシートを開いて、セルB5のAI数式を手動で更新してください。
                </p>
                <a
                  href={selectedIncident.incidentDetailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contrast"
                >
                  <BoxArrowUpRightIcon className="me-1" />
                  詳細スプレッドシートを開く
                </a>
              </div>
            </Article>
          )}

        {/* AI解析結果表示（編集モード時のみ） */}
        {formData.registeredDate &&
          selectedIncident &&
          selectedIncident.aiAnalysisStatus === AI_ANALYSIS_STATUS.COMPLETED &&
          selectedIncident.aiAnalysis && (
            <Article variant={ARTICLE_VARIANT.INFO} className="mb-4">
              <header>
                <h6 className="mb-0">
                  <RobotIcon className="me-2" />
                  AI解析結果
                </h6>
              </header>
              <div>
                <div className="text-pre-wrap">
                  {selectedIncident.aiAnalysis}
                </div>
              </div>
            </Article>
          )}

        {/* フォーム */}
        <form onSubmit={submitForm}>
          <div className="grid">
            {/* 案件名 */}
            <label htmlFor="caseName">
              <span className={styles.requiredLabel}>
                <FolderFillIcon className="text-primary me-1" />
                案件名
              </span>
              <input
                type="text"
                id="caseName"
                value={formData.caseName}
                onChange={handleInputChange}
                required
                placeholder="例: 〇〇システム障害"
              />
              <small>案件を識別できる名前を記入してください</small>
            </label>
            {/* 担当者 */}
            <label htmlFor="assignee">
              <span className={styles.requiredLabel}>
                <PersonFillIcon className="text-primary me-1" />
                担当者
              </span>
              <input
                type="text"
                id="assignee"
                value={formData.assignee}
                onChange={handleInputChange}
                required
                placeholder="例: 山田太郎"
              />
              <small>
                このインシデントを担当する方の名前を1名記入してください
              </small>
            </label>
          </div>

          <div className="grid">
            {/* ステータス */}
            <label htmlFor="status">
              <span className={styles.requiredLabel}>
                <FlagFillIcon className="text-primary me-1" />
                ステータス
              </span>
              <select
                id="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="対応中">対応中</option>
                <option value="保留">保留</option>
                <option value="解決済み">解決済み</option>
                <option value="クローズ">クローズ</option>
              </select>
              <small>現在の対応状況を選択してください</small>
            </label>

            {/* トラブル概要 */}
            <label htmlFor="summary">
              <span className={styles.requiredLabel}>
                <CardTextIcon className="text-primary me-1" />
                トラブル概要
              </span>
              <textarea
                id="summary"
                value={formData.summary}
                onChange={handleInputChange}
                rows={3}
                required
                placeholder="例: サーバーがダウンし、サービスにアクセスできない状態が発生しました"
              ></textarea>
              <small>トラブルの概要を簡潔に記入してください</small>
            </label>
          </div>

          {/* ステークホルダー */}
          <label htmlFor="stakeholders">
            <span className={styles.requiredLabel}>
              <PeopleFillIcon className="text-primary me-1" />
              ステークホルダー
            </span>
            <textarea
              id="stakeholders"
              value={formData.stakeholders}
              onChange={handleInputChange}
              rows={5}
              required
              placeholder={PLACEHOLDERS.STAKEHOLDER}
            ></textarea>
            <small>
              <strong>関係するすべての人物を記載してください：</strong>
              <ul className="mb-0 mt-1">
                <li>顧客・クライアント</li>
                <li>社内関係者（上司、同僚、他部署など）</li>
                <li>外部ベンダー・協力会社</li>
                <li>その他関係者</li>
              </ul>
              些細な関わりでも、名前がわかる人は全員記載してください
            </small>
          </label>

          {/* トラブル詳細 */}
          <label htmlFor="details">
            <span className={styles.requiredLabel}>
              <FileTextFillIcon className="text-primary me-1" />
              トラブル詳細
            </span>
            <textarea
              id="details"
              value={formData.details}
              onChange={handleInputChange}
              rows={10}
              required
              placeholder={PLACEHOLDERS.TROUBLE_DETAIL}
            ></textarea>
            <small>
              <strong>以下の情報をできるだけ詳しく記載してください：</strong>
              <ul className="mb-0 mt-1">
                <li>発生日時・発覚の経緯</li>
                <li>具体的な現象・症状</li>
                <li>影響範囲（ユーザー数、システム範囲など）</li>
                <li>対応状況・時系列</li>
                <li>原因と思われる事項</li>
                <li>過去の類似事例</li>
                <li>その他気づいた点すべて</li>
              </ul>
            </small>
          </label>

          <hr />

          {/* 既存の添付ファイル（編集モード時） */}
          {formData.registeredDate &&
            selectedIncident &&
            selectedIncident.attachments &&
            selectedIncident.attachments.trim() && (
              <div className="mb-3">
                <label>
                  <PaperclipIcon className="me-1" />
                  既存の添付ファイル
                </label>
                <Article variant={ARTICLE_VARIANT.INFO} className="mb-4">
                  <div className="small text-pre-wrap">
                    {selectedIncident.attachments}
                  </div>
                  {selectedIncident.driveFolderUrl && (
                    <div className="mt-2">
                      <a
                        href={selectedIncident.driveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Folder2OpenIcon className="me-1" />
                        Driveフォルダを開く
                      </a>
                    </div>
                  )}
                </Article>
              </div>
            )}

          {/* 関連ファイル */}
          <label htmlFor="fileUpload">
            <CloudUploadIcon className="me-1" />
            <span>
              {formData.registeredDate
                ? '追加ファイルのアップロード'
                : '関連ファイルのアップロード'}
            </span>
            <input
              type="file"
              id="fileUpload"
              onChange={handleFileUpload}
              multiple
            />
            <small>
              {formData.registeredDate
                ? '新しくファイルを追加する場合は選択してください（複数選択可能）'
                : 'メールのやり取り、契約書類、スクリーンショット、動画などをアップロードできます（複数選択可能）'}
            </small>
          </label>

          {/* 選択されたファイルリスト */}
          {formData.fileDataList && formData.fileDataList.length > 0 && (
            <div className="mt-2">
              <small className="text-muted mb-1">選択されたファイル:</small>
              <ul>
                {formData.fileDataList.map((file, index) => (
                  <li key={index}>
                    <span className="small">{file.name}</span>
                    <button
                      type="button"
                      className="contrast outline"
                      onClick={() => removeFile(index)}
                    >
                      <XIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <hr />

          {/* 送信ボタン */}
          <button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <ArrowClockwiseIcon className="me-2" />
                <span>
                  {formData.registeredDate ? '更新中...' : '送信中...'}
                </span>
              </>
            ) : (
              <>
                <CheckCircleFillIcon className="me-2" />
                <span>{formData.registeredDate ? '更新する' : '登録する'}</span>
              </>
            )}
          </button>
        </form>
      </article>

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
