export interface LogRepository {
  isDuplicate(clientMsgId: string): boolean;
  save(values: (string | number | Date)[]): void;
}
