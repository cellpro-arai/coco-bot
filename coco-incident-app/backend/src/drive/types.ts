/**
 * ファイルデータの型定義
 */
export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded
}
