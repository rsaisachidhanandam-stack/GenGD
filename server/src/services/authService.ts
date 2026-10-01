import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { User, Device } from '../types';
import { JWT_SECRET } from '../middleware/auth';

export class AuthService {
  static register(email: string, password: string, name: string): { user: User; token: string } {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(id, email.toLowerCase(), passwordHash, name);

    const user: User = { id, email: email.toLowerCase(), name };
    const token = jwt.sign({ userId: id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return { user, token };
  }

  static login(email: string, password: string): { user: User; token: string } {
    const db = getDatabase();
    const userRow = db.prepare(`
      SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?
    `).get(email.toLowerCase()) as (User & { password_hash: string }) | undefined;

    if (!userRow) {
      throw new Error('Invalid email or password');
    }

    const isValid = bcrypt.compareSync(password, userRow.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const user: User = { id: userRow.id, email: userRow.email, name: userRow.name, created_at: userRow.created_at };
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return { user, token };
  }

  static registerDevice(userId: string, deviceId: string, deviceName: string, platform: string): Device {
    const db = getDatabase();
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as Device | undefined;

    const now = new Date().toISOString();
    if (existing) {
      db.prepare(`
        UPDATE devices SET device_name = ?, platform = ?, last_seen = ? WHERE id = ?
      `).run(deviceName, platform, now, deviceId);
      return { ...existing, device_name: deviceName, platform, last_seen: now };
    }

    db.prepare(`
      INSERT INTO devices (id, user_id, device_name, platform, last_seen)
      VALUES (?, ?, ?, ?, ?)
    `).run(deviceId, userId, deviceName, platform, now);

    return {
      id: deviceId,
      user_id: userId,
      device_name: deviceName,
      platform,
      last_seen: now,
      created_at: now
    };
  }

  static getDevicesForUser(userId: string): Device[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM devices WHERE user_id = ? ORDER BY last_seen DESC').all(userId) as Device[];
  }
}
