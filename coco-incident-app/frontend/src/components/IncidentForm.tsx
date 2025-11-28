import React from 'react';
import {
  Incident,
  IncidentFormData,
  AI_ANALYSIS_STATUS,
} from '../modules/types';

interface IncidentFormProps {
  formData: IncidentFormData;
  setFormData: React.Dispatch<React.SetStateAction<IncidentFormData>>;
  selectedIncident: Incident | null;
  error: string;
  submitting: boolean;
  submitForm: (e: React.FormEvent) => void;
  backToList: () => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
}

const IncidentForm: React.FC<IncidentFormProps> = ({
  formData,
  setFormData,
  selectedIncident,
  error,
  submitting,
  submitForm,
  backToList,
  handleFileUpload,
  removeFile,
}) => {
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div>
      {/* 戻るボタン */}
      <button className="secondary" onClick={backToList}>
        <i className="bi bi-arrow-left"></i>
        一覧へ戻る
      </button>

      {/* フォームカード */}
      <article className="p-4">
        {/* エラー表示 */}
        {error && (
          <article
            className="danger d-flex align-items-center mb-4"
            role="alert"
          >
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            <span>{error}</span>
          </article>
        )}

        {/* 重要な注意事項 */}
        <article className="warning mb-4" role="alert">
          <h6 className="d-flex align-items-center mb-3">
            <i className="bi bi-info-circle-fill me-2"></i>
            重要な注意事項
          </h6>
          <ul className="mb-0">
            <li>すべての情報をできるだけ詳細に記入してください</li>
            <li>些細な情報でも省略せず、すべて記載してください</li>
            <li>情報の加工や省略は行わないでください</li>
            <li>わかる範囲ですべての関係者を記載してください</li>
          </ul>
        </article>

        {/* AI解析待ち表示（編集モード時のみ） */}
        {formData.registeredDate &&
          selectedIncident &&
          selectedIncident.aiAnalysisStatus === AI_ANALYSIS_STATUS.PENDING && (
            <article className="warning mb-4">
              <header>
                <h6 className="mb-0">
                  <i className="bi bi-hourglass-split me-2"></i>
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
                  <i className="bi bi-box-arrow-up-right me-1"></i>
                  詳細スプレッドシートを開く
                </a>
              </div>
            </article>
          )}

        {/* AI解析結果表示（編集モード時のみ） */}
        {formData.registeredDate &&
          selectedIncident &&
          selectedIncident.aiAnalysisStatus === AI_ANALYSIS_STATUS.COMPLETED &&
          selectedIncident.aiAnalysis && (
            <article className="info mb-4">
              <header>
                <h6 className="mb-0">
                  <i className="bi bi-robot me-2"></i>
                  AI解析結果
                </h6>
              </header>
              <div>
                <div className="text-pre-wrap">
                  {selectedIncident.aiAnalysis}
                </div>
              </div>
            </article>
          )}

        {/* フォーム */}
        <form onSubmit={submitForm}>
          <div className="grid">
            {/* 案件名 */}
            <label htmlFor="caseName">
              <span className="required-label">
                <i className="bi bi-folder-fill text-primary me-1"></i>
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
              <span className="required-label">
                <i className="bi bi-person-fill text-primary me-1"></i>
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
              <span className="required-label">
                <i className="bi bi-flag-fill text-primary me-1"></i>
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
              <span className="required-label">
                <i className="bi bi-card-text text-primary me-1"></i>
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
            <span className="required-label">
              <i className="bi bi-people-fill text-primary me-1"></i>
              ステークホルダー
            </span>
            <textarea
              id="stakeholders"
              value={formData.stakeholders}
              onChange={handleInputChange}
              rows={5}
              required
              placeholder={`例:
- 顧客: 株式会社ABC 田中様
- 社内: 開発部 鈴木課長、営業部 佐藤係長
- ベンダー: XYZ社 高橋様`}
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
            <span className="required-label">
              <i className="bi bi-file-text-fill text-primary me-1"></i>
              トラブル詳細
            </span>
            <textarea
              id="details"
              value={formData.details}
              onChange={handleInputChange}
              rows={10}
              required
              placeholder={`例:
【発生日時】2025年1月15日 14:30頃
【発覚の経緯】顧客からの問い合わせ

【現象】
- サービスページにアクセスすると503エラーが表示される
- 管理画面も同様にアクセス不可

【影響範囲】全ユーザー（約1000名）

【対応状況】
14:35 - インフラチームに連絡、調査開始
14:50 - サーバー再起動を実施、復旧せず
15:10 - ログを確認、メモリ不足が原因と判明

【その他】
- 前日にデータベースの大量更新を実施していた
- 同様の事象は過去にも一度発生（2024年12月）`}
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
                  <i className="bi bi-paperclip me-1"></i>
                  既存の添付ファイル
                </label>
                <article className="info">
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
                        <i className="bi bi-folder2-open me-1"></i>
                        Driveフォルダを開く
                      </a>
                    </div>
                  )}
                </article>
              </div>
            )}

          {/* 関連ファイル */}
          <label htmlFor="fileUpload">
            <i className="bi bi-cloud-upload me-1"></i>
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
                      <i className="bi bi-x"></i>
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
                <span className="bi bi-arrow-clockwise me-2"></span>
                <span>
                  {formData.registeredDate ? '更新中...' : '送信中...'}
                </span>
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill me-2"></i>
                <span>{formData.registeredDate ? '更新する' : '登録する'}</span>
              </>
            )}
          </button>
        </form>
      </article>
    </div>
  );
};

export default IncidentForm;
