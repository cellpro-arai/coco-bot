import { ChangeEvent, useRef } from 'react';
import {
  destructiveButtonClass,
  legendBaseClass,
  sectionCardClass,
  secondaryButtonClass,
} from '../../constants/formClasses';

interface FileUploadFieldProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  accept?: string;
  multiple?: boolean;
}

export default function FileUploadField({
  label,
  files,
  onFilesChange,
  onRemoveFile,
  accept = '.pdf,.xlsx,.xls,.jpg,.jpeg,.png',
  multiple = true,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length > 0) {
      onFilesChange(newFiles);
      // ファイル入力をリセットして同じファイルを再度選択できるようにする
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    // デザインを崩さないよう非表示 input を透過的にクリックさせる
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <fieldset className={`${sectionCardClass} space-y-4`}>
      <legend className={legendBaseClass}>{label}</legend>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          id={label}
          onChange={handleFilesChange}
          accept={accept}
          className="hidden"
          multiple={multiple}
        />
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={handleButtonClick}
        >
          {label}を選択
        </button>
        {files.length > 0 && (
          <span className="text-sm text-slate-500">
            {files.length}件のファイルを選択中
          </span>
        )}
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="flex-1 truncate text-sm text-slate-700">
                {file.name}
              </span>
              <button
                type="button"
                className={destructiveButtonClass}
                onClick={() => onRemoveFile(index)}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  );
}
