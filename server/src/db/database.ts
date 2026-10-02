import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDatabase(dbPath?: string): Database.Database {
  if (dbPath) {
    if (dbInstance) {
      try { dbInstance.close(); } catch (_) {}
      dbInstance = null;
    }
  } else if (dbInstance) {
    return dbInstance;
  }

  const targetPath = dbPath || process.env.DATABASE_PATH || path.join(__dirname, '../../data/syncsafe.db');
  
  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(targetPath);

  // Performance and durability settings
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  initSchema(db);

  if (targetPath !== ':memory:') {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@syncsafe.io');
    if (!existing) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('demo1234', 10);
      const userId = '00000000-0000-4000-a000-000000000001';
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password_hash, name)
        VALUES (?, ?, ?, ?)
      `).run(userId, 'demo@syncsafe.io', hash, 'Alex Rivera');
    }
  }

  dbInstance = db;
  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      current_version INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      parent_version INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      device_id TEXT NOT NULL,
      change_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      merge_type TEXT NOT NULL DEFAULT 'direct',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(document_id, version_number),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS changes (
      change_id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      base_version INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL,
      result_version INTEGER,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conflicts (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      incoming_change_id TEXT NOT NULL,
      base_version INTEGER NOT NULL,
      server_version INTEGER NOT NULL,
      conflicting_fields_json TEXT NOT NULL,
      server_state_json TEXT NOT NULL,
      incoming_state_json TEXT NOT NULL,
      base_state_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      resolution_version INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (incoming_change_id) REFERENCES changes(change_id)
    );

    CREATE INDEX IF NOT EXISTS idx_versions_doc_ver ON versions(document_id, version_number);
    CREATE INDEX IF NOT EXISTS idx_changes_doc ON changes(document_id);
    CREATE INDEX IF NOT EXISTS idx_conflicts_doc_status ON conflicts(document_id, status);
  `);
}
