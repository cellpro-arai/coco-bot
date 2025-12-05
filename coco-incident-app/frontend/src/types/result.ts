/**
 * インシデント送信結果型
 */
import { Incident } from './incident';

export interface IncidentResult {
  success: boolean;
  message: string;
  incidentDate: string;
  record: Incident;
}
