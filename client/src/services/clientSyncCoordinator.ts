import { v4 as uuidv4 } from 'uuid';
import { DeviceIndexedDb, type PendingQueueItem, type CachedDocument } from './indexedDbStorage';

export interface SyncStatusState {
  status: 'synced' | 'pending' | 'syncing' | 'conflict' | 'offline' | 'retry';
  message: string;
  pendingCount: number;
  lastSyncedVersion?: number;
}

export class ClientSyncCoordinator {
  public deviceId: string;
  public deviceName: string;
  public isOnline: boolean = true;
  public simulateLatencyMs: number = 0;
  public simulateFailureRate: number = 0; // 0 to 1
  public storage: DeviceIndexedDb;
  private apiBaseUrl: string;
  private getAuthToken: () => string | null;
  private statusListeners: ((state: SyncStatusState) => void)[] = [];

  constructor(
    deviceId: string,
    deviceName: string,
    apiBaseUrl: string,
    getAuthToken: () => string | null
  ) {
    this.deviceId = deviceId;
    this.deviceName = deviceName;
    this.apiBaseUrl = apiBaseUrl;
    this.getAuthToken = getAuthToken;
    this.storage = new DeviceIndexedDb(deviceId);
  }

  public subscribeStatus(listener: (state: SyncStatusState) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private notify(state: SyncStatusState): void {
    for (const listener of this.statusListeners) {
      listener(state);
    }
  }

  public setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    if (online) {
      // Reconnected: trigger queue drain
      this.processPendingQueue();
    } else {
      this.notify({
        status: 'offline',
        message: 'Device is offline. Changes will save locally.',
        pendingCount: 0
      });
    }
  }

  /**
   * Save an edit locally into IndexedDB and queue it for synchronization
   * Complies with TC03, TC10
   */
  async saveAndQueueEdit(
    document: CachedDocument,
    changedFields: Partial<CachedDocument>
  ): Promise<{ queueItem: PendingQueueItem; locallySavedDoc: CachedDocument }> {
    const changeId = uuidv4();
    const now = new Date().toISOString();

    // 1. Update local cached document
    const updatedCachedDoc: CachedDocument = {
      ...document,
      ...changedFields,
      updated_at: now,
      isLocallyModified: true
    };
    await this.storage.saveDocument(updatedCachedDoc);

    // 2. Persist queue item in IndexedDB
    const queueItem: PendingQueueItem = {
      changeId,
      documentId: document.id,
      deviceId: this.deviceId,
      baseVersion: document.current_version,
      payload: changedFields,
      timestamp: now,
      status: 'pending',
      retryCount: 0,
      lastError: null
    };

    await this.storage.enqueueChange(queueItem);

    const pendingQueue = await this.storage.getPendingQueue();

    if (!this.isOnline) {
      this.notify({
        status: 'pending',
        message: 'Saved locally — pending sync (Offline)',
        pendingCount: pendingQueue.length,
        lastSyncedVersion: document.current_version
      });
      return { queueItem, locallySavedDoc: updatedCachedDoc };
    }

    // Attempt sync immediately if online
    this.processPendingQueue();

    return { queueItem, locallySavedDoc: updatedCachedDoc };
  }

  /**
   * Process all pending items in the durable queue
   */
  async processPendingQueue(): Promise<void> {
    const queue = await this.storage.getPendingQueue();
    if (queue.length === 0) {
      this.notify({
        status: 'synced',
        message: 'All changes acknowledged by server',
        pendingCount: 0
      });
      return;
    }

    if (!this.isOnline) {
      this.notify({
        status: 'offline',
        message: `${queue.length} change(s) pending offline`,
        pendingCount: queue.length
      });
      return;
    }

    this.notify({
      status: 'syncing',
      message: `Syncing ${queue.length} pending change(s)...`,
      pendingCount: queue.length
    });

    for (const item of queue) {
      if (item.status === 'conflict') {
        // Skip conflict items until resolved
        continue;
      }

      await this.storage.updateQueueItem(item.changeId, { status: 'in_flight' });

      try {
        if (this.simulateLatencyMs > 0) {
          await new Promise(r => setTimeout(r, this.simulateLatencyMs));
        }

        if (this.simulateFailureRate > 0 && Math.random() < this.simulateFailureRate) {
          throw new Error('Simulated network timeout/drop during upload');
        }

        const token = this.getAuthToken();
        const res = await fetch(`${this.apiBaseUrl}/api/documents/${item.documentId}/changes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            changeId: item.changeId,
            deviceId: this.deviceId,
            baseVersion: item.baseVersion,
            payload: item.payload
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${res.status}`);
        }

        const data = await res.json();

        if (data.status === 'accepted' || data.status === 'already_processed') {
          // Durable server acknowledgement received!
          await this.storage.removeQueueItem(item.changeId);

          if (data.document) {
            await this.storage.saveDocument({
              ...data.document,
              isLocallyModified: false
            });
          }
        } else if (data.status === 'conflict') {
          // Conflict detected by server!
          await this.storage.updateQueueItem(item.changeId, {
            status: 'conflict',
            lastError: data.message || 'Conflict detected on server'
          });

          this.notify({
            status: 'conflict',
            message: 'Conflict detected: Stale base version modified concurrently',
            pendingCount: (await this.storage.getPendingQueue()).length,
            lastSyncedVersion: data.document?.current_version
          });
          return;
        }
      } catch (err: any) {
        // Safe retry rule: retain queue item, never mark synced on failure
        await this.storage.updateQueueItem(item.changeId, {
          status: 'pending',
          retryCount: item.retryCount + 1,
          lastError: err.message
        });

        this.notify({
          status: 'retry',
          message: `Sync failed: ${err.message}. Will retry.`,
          pendingCount: (await this.storage.getPendingQueue()).length
        });
        return;
      }
    }

    const remaining = await this.storage.getPendingQueue();
    if (remaining.length === 0) {
      this.notify({
        status: 'synced',
        message: 'All changes synchronized and acknowledged',
        pendingCount: 0
      });
    }
  }

  /**
   * Fetch latest authoritative document from server
   */
  async fetchAuthoritativeDocument(docId: string): Promise<CachedDocument | null> {
    if (!this.isOnline) {
      const cached = await this.storage.getDocument(docId);
      return cached || null;
    }

    const token = this.getAuthToken();
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/documents/${docId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      const doc = data.document;

      // Update cached storage
      await this.storage.saveDocument({ ...doc, isLocallyModified: false });
      return doc;
    } catch {
      return (await this.storage.getDocument(docId)) || null;
    }
  }
}
