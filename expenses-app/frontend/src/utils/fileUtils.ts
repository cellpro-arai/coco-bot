import { FileData } from '../types';

/**
 * ファイルをBase64エンコードします
 */
export const encodeFileToBase64 = (
  file: File | null
): Promise<FileData | null> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({
        name: file.name,
        mimeType: file.type,
        data: base64,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
