import React from 'react';
import { Incident } from '../types';
import Article, { ARTICLE_VARIANT } from './Article';
import {
  ArrowLeftIcon,
  BoxArrowUpRightIcon,
  CheckCircleFillIcon,
  LightbulbFillIcon,
} from './icons';

interface SuccessModalProps {
  submittedIncident: Incident;
  closeSuccessModal: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  submittedIncident,
  closeSuccessModal,
}) => {
  const isUpdate =
    submittedIncident.updateDate !== submittedIncident.registeredDate;

  return (
    <dialog open>
      <article>
        <header>
          <a
            onClick={e => {
              e.preventDefault();
              closeSuccessModal();
            }}
            href="#"
            aria-label="Close"
            className="close"
          ></a>
          <hgroup>
            <h3 className="mb-2">
              <CheckCircleFillIcon className="me-2" />
              <span>
                インシデント情報の{isUpdate ? '更新' : '登録'}が完了しました！
              </span>
            </h3>
            <p>以下の内容で処理されました。</p>
          </hgroup>
        </header>

        {/* AI改善案の生成（手動） */}
        <Article variant={ARTICLE_VARIANT.WARNING} className="mb-4">
          <header className="mb-2">
            <h6 className="mb-0">
              <LightbulbFillIcon className="me-2" />
              AI改善案を生成しましょう
            </h6>
          </header>

          <p className="mb-3">
            AIによる改善案を生成するには、手動での更新が必要です。
            <br />
            スプレッドシートを開き、改善案の数式セル（B5）を再計算してください。
          </p>

          <a
            href={submittedIncident.incidentDetailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="contrast"
            role="button"
          >
            <BoxArrowUpRightIcon className="me-1" />
            詳細スプレッドシートを開く
          </a>
        </Article>

        <footer>
          <button className="autowidth" onClick={closeSuccessModal}>
            <ArrowLeftIcon className="me-2" />
            一覧へ戻る
          </button>
        </footer>
      </article>
    </dialog>
  );
};

export default SuccessModal;
