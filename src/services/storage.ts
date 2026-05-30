import * as SQLite from 'expo-sqlite';
import { MoodEntry, CompletedExercise, AcademicTask } from '../types';

let db: SQLite.SQLiteDatabase;

export const initDatabase = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('wellness.db');
  
  // Mood Logs table
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS mood_logs (id TEXT PRIMARY KEY NOT NULL, user_id TEXT, mood INTEGER, stress INTEGER, note TEXT, created_at TEXT, synced INTEGER DEFAULT 0);'
  );
  
  // Completed Exercises table
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS completed_exercises (id TEXT PRIMARY KEY NOT NULL, user_id TEXT, exercise_id TEXT, exercise_title TEXT, category TEXT, duration_seconds INTEGER, completed_at TEXT, synced INTEGER DEFAULT 0);'
  );

  // Academic Tasks table
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS academic_tasks (id TEXT PRIMARY KEY NOT NULL, user_id TEXT, title TEXT, sub TEXT, tag TEXT, date TEXT, done INTEGER DEFAULT 0, priority INTEGER DEFAULT 0, synced INTEGER DEFAULT 0);'
  );
  try {
    await db.execAsync("ALTER TABLE academic_tasks ADD COLUMN alert_trigger TEXT DEFAULT 'none';");
  } catch (_) {}
  try {
    await db.execAsync("ALTER TABLE academic_tasks ADD COLUMN notification_id TEXT DEFAULT NULL;");
  } catch (_) {}
  
  // Academic Calendar table
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS academic_calendar (id TEXT PRIMARY KEY NOT NULL, user_id TEXT, title TEXT, date TEXT, endDate TEXT, type TEXT, description TEXT, institution TEXT, priority TEXT, synced INTEGER DEFAULT 0);'
  );
  try {
    await db.execAsync('ALTER TABLE academic_calendar ADD COLUMN priority TEXT;');
  } catch (e) {
    // Column might already exist
  }

  // Dimension Ratings table (Swarbrick 8 Dimensions)
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS dimension_ratings (id TEXT PRIMARY KEY NOT NULL, user_id TEXT, physical INTEGER, emotional INTEGER, social INTEGER, intellectual INTEGER, occupational INTEGER, spiritual INTEGER, environmental INTEGER, financial INTEGER, created_at TEXT, synced INTEGER DEFAULT 0);'
  );

  // Generated Reports table (Weekly, Monthly, Yearly)
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY NOT NULL, user_id TEXT, type TEXT, date_label TEXT, overall_score INTEGER, summary TEXT, content_json TEXT, created_at TEXT, synced INTEGER DEFAULT 0);'
  );

  // Tip Engagements table (User read tips)
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS tip_engagements (user_id TEXT, tip_id TEXT, read_at TEXT, synced INTEGER DEFAULT 0, PRIMARY KEY (user_id, tip_id));'
  );

  return db;
};

// clearAllLocalData is ONLY called when a user enters Guest Mode.
// It clears lightweight session data but NEVER touches dimension_ratings,
// reports, or academic_calendar — those are account-level records.
export const clearAllLocalData = async () => {
  if (!db) await initDatabase();
  await db.execAsync(`
    DELETE FROM mood_logs;
    DELETE FROM completed_exercises;
    DELETE FROM academic_tasks;
    DELETE FROM tip_engagements;
  `);
};

// --- Mood Logs Helpers ---

export const saveMoodLocally = async (entry: MoodEntry) => {
  if (!db) await initDatabase();
  const syncedVal = entry.synced !== undefined ? entry.synced : 0;
  await db.runAsync(
    'INSERT OR IGNORE INTO mood_logs (id, user_id, mood, stress, note, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?);',
    [entry.id, entry.user_id, entry.mood, entry.stress, entry.note || '', entry.created_at, syncedVal]
  );
};

export const saveMoodEntry = async (data: Omit<MoodEntry, 'id'>) => {
  if (!db) await initDatabase();
  const id = Math.random().toString(36).substring(2, 15);
  await saveMoodLocally({ ...data, id });
};

export const getLocalMoodEntries = async (user_id: string): Promise<MoodEntry[]> => {
  if (!db) await initDatabase();
  return await db.getAllAsync('SELECT * FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC;', [user_id]);
};

export const getUnsyncedEntries = async (): Promise<MoodEntry[]> => {
  if (!db) await initDatabase();
  return await db.getAllAsync('SELECT * FROM mood_logs WHERE synced = 0;');
};

export const markAsSynced = async (id: string) => {
  if (!db) await initDatabase();
  await db.runAsync('UPDATE mood_logs SET synced = 1 WHERE id = ?;', [id]);
};

export const deleteLocalEntry = async (id: string) => {
  if (!db) await initDatabase();
  await db.runAsync('DELETE FROM mood_logs WHERE id = ?;', [id]);
};

// --- Completed Exercises Helpers ---

export const saveCompletedExerciseLocally = async (entry: CompletedExercise) => {
  if (!db) await initDatabase();
  const syncedVal = entry.synced !== undefined ? entry.synced : 0;
  await db.runAsync(
    'INSERT OR IGNORE INTO completed_exercises (id, user_id, exercise_id, exercise_title, category, duration_seconds, completed_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
    [entry.id, entry.user_id, entry.exercise_id, entry.exercise_title, entry.category, entry.duration_seconds, entry.completed_at, syncedVal]
  );
};

export const getLocalCompletedExercises = async (user_id: string): Promise<CompletedExercise[]> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT * FROM completed_exercises WHERE user_id = ? ORDER BY completed_at DESC;', [user_id]);
  return rows as CompletedExercise[];
};

export const getUnsyncedCompletedExercises = async (): Promise<CompletedExercise[]> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT * FROM completed_exercises WHERE synced = 0;');
  return rows as CompletedExercise[];
};

export const markCompletedExerciseAsSynced = async (id: string) => {
  if (!db) await initDatabase();
  await db.runAsync('UPDATE completed_exercises SET synced = 1 WHERE id = ?;', [id]);
};

export const deleteLocalCompletedExercise = async (id: string) => {
  if (!db) await initDatabase();
  await db.runAsync('DELETE FROM completed_exercises WHERE id = ?;', [id]);
};

// --- Academic Tasks Helpers ---

export const saveAcademicTaskLocally = async (task: AcademicTask) => {
  if (!db) await initDatabase();
  const syncedVal = task.synced !== undefined ? task.synced : 0;
  await db.runAsync(
    'INSERT INTO academic_tasks (id, user_id, title, sub, tag, date, done, priority, synced, alert_trigger, notification_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
    [
      task.id, 
      task.user_id, 
      task.title, 
      task.sub || '', 
      task.tag, 
      task.date, 
      task.done ? 1 : 0, 
      task.priority ? 1 : 0, 
      syncedVal, 
      task.alert_trigger || 'none', 
      task.notification_id || null
    ]
  );
};

export const getLocalAcademicTasks = async (user_id: string): Promise<AcademicTask[]> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT * FROM academic_tasks WHERE user_id = ? ORDER BY date ASC;', [user_id]);
  return (rows as any[]).map(r => ({
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    sub: r.sub,
    tag: r.tag,
    date: r.date,
    done: r.done === 1,
    priority: r.priority === 1,
    synced: r.synced,
    alert_trigger: r.alert_trigger || 'none',
    notification_id: r.notification_id || undefined
  }));
};

export const updateAcademicTaskLocally = async (id: string, done: boolean) => {
  if (!db) await initDatabase();
  if (done) {
    await db.runAsync('UPDATE academic_tasks SET done = 1, notification_id = NULL, synced = 0 WHERE id = ?;', [id]);
  } else {
    await db.runAsync('UPDATE academic_tasks SET done = 0, synced = 0 WHERE id = ?;', [id]);
  }
};

export const deleteLocalAcademicTask = async (id: string) => {
  if (!db) await initDatabase();
  await db.runAsync('DELETE FROM academic_tasks WHERE id = ?;', [id]);
};

export const getUnsyncedAcademicTasks = async (): Promise<AcademicTask[]> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT * FROM academic_tasks WHERE synced = 0;');
  return (rows as any[]).map(r => ({
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    sub: r.sub,
    tag: r.tag,
    date: r.date,
    done: r.done === 1,
    priority: r.priority === 1,
    synced: r.synced,
    alert_trigger: r.alert_trigger || 'none',
    notification_id: r.notification_id || undefined
  }));
};

export const markAcademicTaskAsSynced = async (id: string) => {
  if (!db) await initDatabase();
  await db.runAsync('UPDATE academic_tasks SET synced = 1 WHERE id = ?;', [id]);
};

// --- Calendar Helpers ---

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  date: string;
  endDate: string;
  type: string;
  description: string;
  institution: string;
  priority: 'high' | 'medium' | 'low';
  synced: number;
}

export const getLocalCalendarEvents = async (user_id: string): Promise<CalendarEvent[]> => {
  if (!db) await initDatabase();
  return (await db.getAllAsync('SELECT * FROM academic_calendar WHERE user_id = ? ORDER BY date ASC;', [user_id])) as CalendarEvent[];
};

// Save a single personal calendar event (added manually by user)
export const saveCalendarEventLocally = async (event: CalendarEvent) => {
  if (!db) await initDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO academic_calendar (id, user_id, title, date, endDate, type, description, institution, priority, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1);',
    [event.id, event.user_id, event.title, event.date, event.endDate ?? '', event.type, event.description ?? '', event.institution ?? 'personal', event.priority ?? 'medium']
  );
};

export const seedAcademicCalendar = async (user_id: string, institution: string) => {
  if (institution !== 'gimpa') return;
  if (!db) await initDatabase();

  // Clean old GIMPA institutional events to ensure the new 2025/2026 dates are loaded
  await db.runAsync("DELETE FROM academic_calendar WHERE user_id = ? AND institution = 'gimpa';", [user_id]);

  try {
    const { scheduleDeadlineReminder } = require('./notificationService');
    const calendarData = require('../../assets/data/academic_calendar_gimpa.json');
    for (const event of calendarData) {
      await db.runAsync(
        'INSERT OR IGNORE INTO academic_calendar (id, user_id, title, date, endDate, type, description, institution, priority, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0);',
        [event.id, user_id, event.title, event.date, event.endDate, event.type, event.description, event.institution, event.priority || 'medium']
      );
      if ((event.type === 'exam' || event.type === 'deadline') && event.priority === 'high') {
        scheduleDeadlineReminder(event.title, event.date).catch(console.error);
      }
    }
  } catch (error) {
    console.error('Failed to seed academic calendar:', error);
  }
};
// --- Dimension Ratings Helpers (8 Dimensions) ---

export interface DimensionRating {
  id: string;
  user_id: string;
  physical: number;
  emotional: number;
  social: number;
  intellectual: number;
  occupational: number;
  spiritual: number;
  environmental: number;
  financial: number;
  created_at: string;
  synced: number;
}

export const saveDimensionRatingsLocally = async (rating: Omit<DimensionRating, 'synced'> & { synced?: number }) => {
  if (!db) await initDatabase();
  const syncedVal = rating.synced !== undefined ? rating.synced : 0;
  await db.runAsync(
    `INSERT OR IGNORE INTO dimension_ratings (id, user_id, physical, emotional, social, intellectual, occupational, spiritual, environmental, financial, created_at, synced) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [rating.id, rating.user_id, rating.physical, rating.emotional, rating.social, rating.intellectual, rating.occupational, rating.spiritual, rating.environmental, rating.financial, rating.created_at, syncedVal]
  );
};

export const getLatestDimensionRatings = async (user_id: string): Promise<DimensionRating | null> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT * FROM dimension_ratings WHERE user_id = ? ORDER BY created_at DESC LIMIT 1;', [user_id]);
  return rows.length > 0 ? (rows[0] as DimensionRating) : null;
};

export const getUnsyncedDimensionRatings = async (): Promise<DimensionRating[]> => {
  if (!db) await initDatabase();
  return (await db.getAllAsync('SELECT * FROM dimension_ratings WHERE synced = 0;')) as DimensionRating[];
};

export const markDimensionRatingAsSynced = async (id: string) => {
  if (!db) await initDatabase();
  await db.runAsync('UPDATE dimension_ratings SET synced = 1 WHERE id = ?;', [id]);
};

// --- Reports Helpers ---

export interface WellnessReport {
  id: string;
  user_id: string;
  type: 'weekly' | 'monthly' | 'yearly';
  date_label: string;
  overall_score: number;
  summary: string;
  content_json: string;
  created_at: string;
  synced: number;
}

export const saveReportLocally = async (report: Omit<WellnessReport, 'synced'> & { synced?: number }) => {
  if (!db) await initDatabase();
  const syncedVal = report.synced !== undefined ? report.synced : 0;
  // INSERT OR IGNORE so rehydration is safe to call multiple times without duplicate errors
  await db.runAsync(
    `INSERT OR IGNORE INTO reports (id, user_id, type, date_label, overall_score, summary, content_json, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [report.id, report.user_id, report.type, report.date_label, report.overall_score, report.summary, report.content_json, report.created_at, syncedVal]
  );
};

export const getLocalReports = async (user_id: string): Promise<WellnessReport[]> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC;', [user_id]);
  return rows as WellnessReport[];
};

export const getLatestReportByType = async (user_id: string, type: string): Promise<WellnessReport | null> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT * FROM reports WHERE user_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1;', [user_id, type]);
  return rows.length > 0 ? (rows[0] as WellnessReport) : null;
};

export const getUnsyncedReports = async (): Promise<WellnessReport[]> => {
  if (!db) await initDatabase();
  return (await db.getAllAsync('SELECT * FROM reports WHERE synced = 0;')) as WellnessReport[];
};

export const markReportAsSynced = async (id: string) => {
  if (!db) await initDatabase();
  await db.runAsync('UPDATE reports SET synced = 1 WHERE id = ?;', [id]);
};

// --- Tip Engagements Helpers ---

export const saveTipEngagementLocally = async (userId: string, tipId: string, readAt: string, synced: number = 0) => {
  if (!db) await initDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO tip_engagements (user_id, tip_id, read_at, synced) VALUES (?, ?, ?, ?);',
    [userId, tipId, readAt, synced]
  );
};

export const getLocalTipEngagements = async (userId: string): Promise<string[]> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT tip_id FROM tip_engagements WHERE user_id = ?;', [userId]);
  return (rows as { tip_id: string }[]).map(r => r.tip_id);
};

export const getUnsyncedTipEngagements = async (): Promise<{ user_id: string; tip_id: string; read_at: string }[]> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT user_id, tip_id, read_at FROM tip_engagements WHERE synced = 0;');
  return rows as { user_id: string; tip_id: string; read_at: string }[];
};

export const markTipEngagementAsSynced = async (userId: string, tipId: string) => {
  if (!db) await initDatabase();
  await db.runAsync('UPDATE tip_engagements SET synced = 1 WHERE user_id = ? AND tip_id = ?;', [userId, tipId]);
};

export const getLocalTipEngagementsDetail = async (userId: string): Promise<{ tip_id: string; read_at: string }[]> => {
  if (!db) await initDatabase();
  const rows = await db.getAllAsync('SELECT tip_id, read_at FROM tip_engagements WHERE user_id = ?;', [userId]);
  return rows as { tip_id: string; read_at: string }[];
};
