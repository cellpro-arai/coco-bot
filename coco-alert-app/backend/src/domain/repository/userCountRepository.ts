export interface UserCountRepository {
  increment(userName: string): number;
}
