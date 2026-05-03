import * as SQLite from 'expo-sqlite';
import { MoodEntry } from '../types';

let db: SQLite.SQLiteDatabase;

export const initDatabase = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('wellness.db');
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS mood_logs (id TEXT PRIMARY KEY NOT NULL, user_id TEXT, mood INTEGER, stress INTEGER, note TEXT, created_at TEXT, synced INTEGER DEFAULT 0);'
  );
  return db;
};

export const saveMoodLocally = async (entry: MoodEntry) => {
  await db.runAsync(
    'INSERT INTO mood_logs (id, user_id, mood, stress, note, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, 0);',
    [entry.id, entry.user_id, entry.mood, entry.stress, entry.note || '', entry.created_at]
  );
};

export const saveMoodEntry = async (data: Omit<MoodEntry, 'id'>) => {
  if (!db) await initDatabase();
  const id = Math.random().toString(36).substring(2, 15);
  await saveMoodLocally({ ...data, id });
};

export const getLocalMoodEntries = async (): Promise<MoodEntry[]> => {
  if (!db) return [];
  return await db.getAllAsync('SELECT * FROM mood_logs ORDER BY created_at DESC;');
};

export const getUnsyncedEntries = async (): Promise<MoodEntry[]> => {
  if (!db) return [];
  return await db.getAllAsync('SELECT * FROM mood_logs WHERE synced = 0;');
};

export const markAsSynced = async (id: string) => {
  await db.runAsync('UPDATE mood_logs SET synced = 1 WHERE id = ?;', [id]);
};

export const deleteLocalEntry = async (id: string) => {
  await db.runAsync('DELETE FROM mood_logs WHERE id = ?;', [id]);
};
