import { ChangeEvent } from 'react';
import { fieldLabelClass, inputFieldClass } from '../../types/constants';

interface NameFieldProps {
  /** 氏名の値 */
  name: string;
  /** 変更時のハンドラ */
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** 編集可能かどうか */
  isEditable: boolean;
  /** ローディング中かどうか */
  isLoading: boolean;
}

/**
 * 氏名入力フィールドコンポーネント
 *
 * 従業員管理テーブルから氏名を取得できた場合は編集不可、
 * 取得できなかった場合は編集可能な入力フィールドを表示します。
 */
export default function NameField({
  name,
  onChange,
  isEditable,
  isLoading,
}: NameFieldProps) {
  return (
    <label htmlFor="name" className={`flex flex-col gap-2 ${fieldLabelClass}`}>
      <span className="flex items-center gap-1">
        氏名 <span className="text-rose-500">*</span>
        {!isEditable && (
          <span className="ml-2 text-xs text-slate-500">(自動取得)</span>
        )}
      </span>
      <input
        type="text"
        id="name"
        name="name"
        value={name}
        onChange={onChange}
        required
        disabled={!isEditable || isLoading}
        placeholder={isLoading ? '読み込み中...' : '山田 太郎'}
        className={`${inputFieldClass} ${!isEditable ? 'bg-slate-100 cursor-not-allowed' : ''}`}
      />
    </label>
  );
}
