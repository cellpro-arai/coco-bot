/**
 * インシデント一覧表示用型
 */
export interface Incident {
  registeredDate: string;
  registeredUser: string;
  caseName: string;
  assignee: string;
  status: string;
  updateDate: string;
  driveFolderUrl: string;
  incidentDetailUrl: string;
  summary?: string;
  stakeholders?: string;
  details?: string;
  attachments?: string;
}
