import { openDB, type IDBPDatabase } from 'idb';

export interface PendingQueueItem {
  changeId: string;
  documentId: string;
  deviceId: string;
  baseVersion: number;
  payload: {
    title?: string;
    status?: 'draft' | 'in_review' | 'approved' | 'archived';
    description?: string;
    content?: string;
  };
  timestamp: string;
  status: 'pending' | 'in_flight' | 'acknowledged' | 'conflict';
  retryCount: number;
  lastError: string | null;
}

export interface CachedDocument {
  id: string;
  owner_id: string;
  name: string;
  current_version: number;
  title: string;
  status: 'draft' | 'in_review' | 'approved' | 'archived';
  description: string;
  content: string;
  updated_at: string;
  isLocallyModified?: boolean;
}

const DB_VERSION = 1;

export class DeviceIndexedDb {
  private dbPromise: Promise<IDBPDatabase>;
  public deviceId: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    const dbName = `syncsafe_db_${deviceId}`;

    this.dbPromise = openDB(dbName, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cached_documents')) {
          db.createObjectStore('cached_documents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_queue')) {
          const queueStore = db.createObjectStore('pending_queue', { keyPath: 'changeId' });
          queueStore.createIndex('by_doc', 'documentId');
          queueStore.createIndex('by_status', 'status');
        }
      }
    });
  }

  async saveDocument(doc: CachedDocument): Promise<void> {
    const db = await this.dbPromise;
    await db.put('cached_documents', doc);
  }

  async getDocument(id: string): Promise<CachedDocument | undefined> {
    const db = await this.dbPromise;
    return db.get('cached_documents', id);
  }

  async getAllDocuments(): Promise<CachedDocument[]> {
    const db = await this.dbPromise;
    return db.getAll('cached_documents');
  }

  async enqueueChange(item: PendingQueueItem): Promise<void> {
    const db = await this.dbPromise;
    await db.put('pending_queue', item);
  }

  async getPendingQueue(): Promise<PendingQueueItem[]> {
    const db = await this.dbPromise;
    const items = await db.getAll('pending_queue');
    // Sort chronologically
    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async updateQueueItem(changeId: string, updates: Partial<PendingQueueItem>): Promise<void> {
    const db = await this.dbPromise;
    const item = await db.get('pending_queue', changeId);
    if (item) {
      await db.put('pending_queue', { ...item, ...updates });
    }
  }

  async removeQueueItem(changeId: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('pending_queue', changeId);
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('cached_documents');
    await db.clear('pending_queue');
  }
}
