const CACHE_KEY = 'duplicate_check_cache';
const CACHE_DURATION = 120; // 2分（秒）

export interface CheckDuplicateRepository {
  isDuplicate(clientMsgId: string): boolean;
}

export class CacheRepositoryImpl implements CheckDuplicateRepository {
  private cache: GoogleAppsScript.Cache.Cache;

  constructor() {
    this.cache = CacheService.getScriptCache();
  }

  isDuplicate(clientMsgId: string): boolean {
    const cachedClientMsgIds = this.getCachedClientMsgIds();

    if (cachedClientMsgIds.includes(clientMsgId)) {
      return true;
    }

    // キャッシュになければ追加
    this.addToCache(clientMsgId);
    return false;
  }

  private getCachedClientMsgIds(): string[] {
    const cachedData = this.cache.get(CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : [];
  }

  private addToCache(clientMsgId: string): void {
    const cachedClientMsgIds = this.getCachedClientMsgIds();
    cachedClientMsgIds.push(clientMsgId);
    this.cache.put(
      CACHE_KEY,
      JSON.stringify(cachedClientMsgIds),
      CACHE_DURATION
    );
  }
}
