import { createSeededStore } from '@viraliza/db';
import type { DataStore } from '@viraliza/db';
import { appConfig } from './config';

/**
 * Process-wide data store singleton (dev). Survives Next.js hot reloads by
 * hanging off globalThis. In production with DATABASE_URL set, swap this for
 * `new PrismaStore(new PrismaClient())`.
 */
const globalForStore = globalThis as unknown as { __viralizaStore?: Promise<DataStore> };

export function getStore(): Promise<DataStore> {
  if (!globalForStore.__viralizaStore) {
    globalForStore.__viralizaStore = createSeededStore(appConfig.appUrl);
  }
  return globalForStore.__viralizaStore;
}
