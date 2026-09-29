import { offlineDb } from './db';
import { AttendanceRecord, OfflineQueueItem } from '../types';

export type SyncState = 'online_synced' | 'offline_saved' | 'syncing' | 'error';

class SyncEngine {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(state: SyncState, pendingCount: number) => void> = new Set();
  private currentState: SyncState = 'online_synced';
  private syncInProgress: boolean = false;
  private isProcessing: boolean = false;
  private queuedPromise: Promise<{ success: boolean; syncedCount: number }> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Periodic check every 30 seconds
      setInterval(() => {
        if (this.isOnline && !this.syncInProgress) {
          this.flushQueue();
        }
      }, 30000);
    }
  }

  public subscribe(callback: (state: SyncState, pendingCount: number) => void) {
    this.listeners.add(callback);
    this.getPendingCount().then((count) => {
      callback(this.currentState, count);
    });
    return () => {
      this.listeners.delete(callback);
    };
  }

  public async getPendingCount(): Promise<number> {
    try {
      return await offlineDb.syncQueue.count();
    } catch {
      return 0;
    }
  }

  private async notify() {
    const count = await this.getPendingCount();
    if (!this.isOnline) {
      this.currentState = 'offline_saved';
    } else if (this.syncInProgress) {
      this.currentState = 'syncing';
    } else if (count > 0) {
      this.currentState = 'offline_saved';
    } else {
      this.currentState = 'online_synced';
    }

    this.listeners.forEach((cb) => cb(this.currentState, count));
  }

  /**
   * Save an attendance record offline first, queue it, and trigger background sync if online.
   */
  public async recordAttendance(record: AttendanceRecord): Promise<void> {
    const clientSyncId = record.clientSyncId || `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const markedRecord: AttendanceRecord = {
      ...record,
      clientSyncId,
      syncStatus: this.isOnline ? 'SYNCED' : 'PENDING_OFFLINE',
      updatedAt: new Date().toISOString(),
    };

    // 1. Store in Dexie local attendance cache
    await offlineDb.attendance.put(markedRecord);

    // 2. Add to Sync Queue
    const queueItem: OfflineQueueItem = {
      id: clientSyncId,
      clientSyncId,
      payload: markedRecord,
      createdAt: Date.now(),
      retryCount: 0,
    };
    await offlineDb.syncQueue.put(queueItem);
    await this.notify();

    // 3. If online, flush immediately in background
    if (this.isOnline) {
      await this.flushQueue();
    }
  }

  /**
   * Bulk record multiple student attendance records
   */
  public async bulkRecordAttendance(records: AttendanceRecord[]): Promise<void> {
    const now = new Date().toISOString();
    const queueItems: OfflineQueueItem[] = [];

    for (const rec of records) {
      const clientSyncId = rec.clientSyncId || `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const updated: AttendanceRecord = {
        ...rec,
        clientSyncId,
        syncStatus: this.isOnline ? 'SYNCED' : 'PENDING_OFFLINE',
        updatedAt: now,
      };
      await offlineDb.attendance.put(updated);
      queueItems.push({
        id: clientSyncId,
        clientSyncId,
        payload: updated,
        createdAt: Date.now(),
        retryCount: 0,
      });
    }

    if (queueItems.length > 0) {
      await offlineDb.syncQueue.bulkPut(queueItems);
    }
    await this.notify();

    if (this.isOnline) {
      await this.flushQueue();
    }
  }

  /**
   * Process all queued payloads to server using a continuous draining loop
   */
  public async flushQueue(): Promise<{ success: boolean; syncedCount: number }> {
    if (this.isProcessing) {
      if (!this.queuedPromise) {
        this.queuedPromise = (async () => {
          while (this.isProcessing) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          this.queuedPromise = null;
          return this.flushQueue();
        })();
      }
      return this.queuedPromise;
    }

    this.isProcessing = true;
    this.syncInProgress = true;
    this.notify();

    let totalSynced = 0;
    try {
      // Continuous loop: drain all items until queue is completely empty
      while (true) {
        const queue = await offlineDb.syncQueue.toArray();
        if (queue.length === 0) {
          break;
        }

        const payloads = queue.map((item) => item.payload);
        const res = await fetch('/api/attendance/sync-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: payloads }),
        });

        if (!res.ok) {
          throw new Error(`Sync server responded with ${res.status}`);
        }

        const result = await res.json();
        const syncedIds = queue.map((q) => q.id);

        // Remove synced items from queue
        await offlineDb.syncQueue.bulkDelete(syncedIds);

        // Mark local records as SYNCED
        for (const item of queue) {
          const local = await offlineDb.attendance.get(item.payload.id);
          if (local) {
            local.syncStatus = 'SYNCED';
            await offlineDb.attendance.put(local);
          }
        }

        totalSynced += result.syncedCount || queue.length;
      }

      this.isProcessing = false;
      this.syncInProgress = false;
      this.notify();
      return { success: true, syncedCount: totalSynced };
    } catch (err) {
      console.warn('Sync flush postponed: offline or server unavailable', err);
      this.isProcessing = false;
      this.syncInProgress = false;
      this.notify();
      return { success: false, syncedCount: totalSynced };
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const syncEngine = new SyncEngine();
