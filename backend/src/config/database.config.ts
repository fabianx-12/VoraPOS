export interface DatabasePragmaConfig {
  journalMode: 'WAL' | 'DELETE' | 'MEMORY';
  synchronous: 'NORMAL' | 'FULL' | 'OFF';
  busyTimeoutMs: number;
  foreignKeys: boolean;
  tempStore: 'MEMORY' | 'FILE';
  cacheSize: number;
}

export const databaseConfig: DatabasePragmaConfig = {
  journalMode: 'WAL',
  synchronous: 'NORMAL',
  busyTimeoutMs: 5000,
  foreignKeys: true,
  tempStore: 'MEMORY',
  cacheSize: -64000, // 64MB cache
};
