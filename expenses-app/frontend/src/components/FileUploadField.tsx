import { ChangeEvent, useRef } from 'react';

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
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <fieldset>
      <label htmlFor={label}>{label}</label>
      <div className="work-schedule-input">
        <input
          ref={inputRef}
          type="file"
          id={label}
          onChange={handleFilesChange}
          accept={accept}
          style={{ display: 'none' }}
          multiple={multiple}
        />
        <button type="button" className="secondary" onClick={handleButtonClick}>
          {label}を選択
        </button>
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          {files.map((file, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.3rem',
              }}
            >
              <span className="file-name" style={{ flex: 1 }}>
                {file.name}
              </span>
              <button
                type="button"
                className="secondary"
                onClick={() => onRemoveFile(index)}
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.8rem',
                }}
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
