import { ChangeEvent } from 'react';
import { fieldLabelClass, inputFieldClass } from '../../constants/formClasses';

interface RemarksFieldProps {
  /** 備考の値 */
  value: string;
  /** 変更時のハンドラ */
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

/**
 * 備考入力フィールドコンポーネント
 */
export default function RemarksField({ value, onChange }: RemarksFieldProps) {
  return (
    <label
      htmlFor="remarks"
      className={`flex flex-col gap-2 ${fieldLabelClass}`}
    >
      備考
      <textarea
        id="remarks"
        name="remarks"
        value={value}
        onChange={onChange}
        rows={4}
        placeholder="その他連絡事項があればご記入ください"
        className={`${inputFieldClass} min-h-32`}
      ></textarea>
    </label>
  );
}
