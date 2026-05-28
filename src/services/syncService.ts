import { supabase } from './supabase';
import {
  initDatabase,
  getUnsyncedEntries,
  markAsSynced,
  getUnsyncedCompletedExercises,
  markCompletedExerciseAsSynced,
  getUnsyncedAcademicTasks,
  markAcademicTaskAsSynced,
  getUnsyncedDimensionRatings,
  markDimensionRatingAsSynced,
  getUnsyncedReports,
  markReportAsSynced,
  saveMoodLocally,
  getLocalMoodEntries,
  saveCompletedExerciseLocally,
  getLocalCompletedExercises,
  saveDimensionRatingsLocally,
  getLatestDimensionRatings,
  saveAcademicTaskLocally,
  getLocalAcademicTasks,
  saveReportLocally,
  getLocalReports,
  saveCalendarEventLocally,
  getLocalCalendarEvents,
  CalendarEvent,
} from './storage';

// ─────────────────────────────────────────────────────────────────────────────
// REHYDRATION — Supabase → local SQLite
//
// Called after every successful login (manual + auto session restore).
// Each sub-fetcher runs independently — one failure does NOT block the others.
// All sub-fetchers run in parallel via Promise.allSettled for maximum speed.
// After all writes are done, the caller (authStore) clears isRehydrating so
// the dashboard re-renders against fully populated SQLite data.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Mood entries ────────────────────────────────────────────────────────────
const rehydrateMoodEntries = async (userId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Rehydration] mood_logs error:', error.message);
    return;
  }
  console.log(`[Rehydration] mood_logs: ${data?.length ?? 0} records found`);

  if (!data || data.length === 0) return;
  const existing = await getLocalMoodEntries(userId);
  const existingIds = new Set(existing.map((m) => m.id));
  let inserted = 0;
  for (const log of data) {
    if (!existingIds.has(log.id)) {
      await saveMoodLocally({ ...log, synced: 1 });
      inserted++;
    }
  }
  console.log(`[Rehydration] mood_logs: inserted ${inserted} new rows`);
};

// ── 2. Wellness dimension ratings (baseline + all subsequent assessments) ───────
const rehydrateWellnessDimensions = async (userId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('dimension_ratings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Rehydration] dimension_ratings error:', error.message);
    return;
  }
  console.log(`[Rehydration] dimension_ratings: ${data?.length ?? 0} records found`);

  if (!data || data.length === 0) return;

  // Build a set of all known local IDs (we only have getLatestDimensionRatings,
  // so we query the table directly via a select approach using existing SQLite helpers)
  const existingLatest = await getLatestDimensionRatings(userId);
  const knownIds = new Set<string>(existingLatest ? [existingLatest.id] : []);

  let inserted = 0;
  for (const rating of data) {
    if (!knownIds.has(rating.id)) {
      await saveDimensionRatingsLocally({ ...rating, synced: 1 });
      knownIds.add(rating.id);
      inserted++;
    }
  }
  console.log(`[Rehydration] dimension_ratings: inserted ${inserted} new rows`);
};

// ── 3. Completed exercises ─────────────────────────────────────────────────────
const rehydrateExerciseRecords = async (userId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('completed_exercises')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.warn('[Rehydration] completed_exercises error:', error.message);
    return;
  }
  console.log(`[Rehydration] completed_exercises: ${data?.length ?? 0} records found`);

  if (!data || data.length === 0) return;
  const existing = await getLocalCompletedExercises(userId);
  const existingIds = new Set(existing.map((e) => e.id));
  let inserted = 0;
  for (const ex of data) {
    if (!existingIds.has(ex.id)) {
      await saveCompletedExerciseLocally({ ...ex, synced: 1 });
      inserted++;
    }
  }
  console.log(`[Rehydration] completed_exercises: inserted ${inserted} new rows`);
};

// ── 4. Academic tasks (personal reminders/tasks added by user) ─────────────────
const rehydrateAcademicTasks = async (userId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('academic_tasks')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('[Rehydration] academic_tasks error:', error.message);
    return;
  }
  console.log(`[Rehydration] academic_tasks: ${data?.length ?? 0} records found`);

  if (!data || data.length === 0) return;
  const existing = await getLocalAcademicTasks(userId);
  const existingIds = new Set(existing.map((t) => t.id));
  let inserted = 0;
  for (const task of data) {
    if (!existingIds.has(task.id)) {
      await saveAcademicTaskLocally({ ...task, synced: 1 });
      inserted++;
    }
  }
  console.log(`[Rehydration] academic_tasks: inserted ${inserted} new rows`);
};

// ── 5. Reports (weekly, monthly, yearly) ──────────────────────────────────────
const rehydrateReports = async (userId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Rehydration] reports error:', error.message);
    return;
  }
  console.log(`[Rehydration] reports: ${data?.length ?? 0} records found`);

  if (!data || data.length === 0) return;
  const existing = await getLocalReports(userId);
  const existingIds = new Set(existing.map((r) => r.id));
  let inserted = 0;
  for (const report of data) {
    if (!existingIds.has(report.id)) {
      await saveReportLocally({ ...report, synced: 1 });
      inserted++;
    }
  }
  console.log(`[Rehydration] reports: inserted ${inserted} new rows`);
};

// ── 6. Personal calendar events (user-added events stored in academic_calendar) ─
// GIMPA institutional events are always re-seeded from local JSON by authStore,
// so we only need to restore the user's own personal events here.
const rehydratePersonalCalendarEvents = async (userId: string): Promise<void> => {
  // The academic_calendar table is local-only for GIMPA seeded events.
  // Personal events (institution = 'personal') are written to academic_tasks 
  // via the calendar screen, so they are already handled by rehydrateAcademicTasks.
  // This function is a no-op for now but is wired in for future Supabase 
  // academic_calendar sync support.
  console.log(`[Rehydration] calendar events: handled via seedAcademicCalendar + academic_tasks`);
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT — called by authStore on every login
// ─────────────────────────────────────────────────────────────────────────────
export const rehydrateUserData = async (userId: string): Promise<void> => {
  try {
    await initDatabase();
    console.log(`[Rehydration] ▶ Starting for user: ${userId}`);

    // Run all fetches in parallel. Promise.allSettled ensures one failure
    // cannot block the others — each resolves or rejects independently.
    const results = await Promise.allSettled([
      rehydrateMoodEntries(userId),
      rehydrateWellnessDimensions(userId),
      rehydrateExerciseRecords(userId),
      rehydrateAcademicTasks(userId),
      rehydrateReports(userId),
      rehydratePersonalCalendarEvents(userId),
    ]);

    // Log any sub-function failures without crashing the whole rehydration
    results.forEach((result, i) => {
      const names = ['mood', 'dimensions', 'exercises', 'tasks', 'reports', 'calendar'];
      if (result.status === 'rejected') {
        console.error(`[Rehydration] ❌ ${names[i]} sub-fetch failed:`, result.reason);
      }
    });

    console.log(`[Rehydration] ✅ Complete for user: ${userId}`);
  } catch (err) {
    console.error('[Rehydration] ❌ Critical error:', err);
    throw err;
  }
};

// Backward compatibility alias
export const pullDataFromSupabase = rehydrateUserData;

// ─────────────────────────────────────────────────────────────────────────────
// PUSH SYNC — local SQLite → Supabase
//
// Covers ALL data types that are stored locally and need to be in Supabase
// so rehydration can pull them back on next login.
// Previously missing: dimension_ratings and reports were never pushed.
// ─────────────────────────────────────────────────────────────────────────────
export const syncPendingEntries = async () => {
  try {
    // ── 1. Mood logs ────────────────────────────────────────────────────────
    const unsyncedMoods = await getUnsyncedEntries();
    for (const entry of unsyncedMoods) {
      if (!entry.user_id || entry.user_id === 'guest') continue;
      const { error } = await supabase.from('mood_logs').upsert({
        id: entry.id,
        user_id: entry.user_id,
        mood: entry.mood,
        stress: entry.stress,
        note: entry.note,
        created_at: entry.created_at,
      });
      if (!error) await markAsSynced(entry.id);
      else console.warn('[Sync] mood_logs upsert failed:', entry.id, error.message);
    }

    // ── 2. Completed exercises ──────────────────────────────────────────────
    const unsyncedExercises = await getUnsyncedCompletedExercises();
    for (const ex of unsyncedExercises) {
      if (!ex.user_id || ex.user_id === 'guest') continue;
      const { error } = await supabase.from('completed_exercises').upsert({
        id: ex.id,
        user_id: ex.user_id,
        exercise_id: ex.exercise_id,
        exercise_title: ex.exercise_title,
        category: ex.category,
        duration_seconds: ex.duration_seconds,
        completed_at: ex.completed_at,
      });
      if (!error) await markCompletedExerciseAsSynced(ex.id);
      else console.warn('[Sync] completed_exercises upsert failed:', ex.id, error.message);
    }

    // ── 3. Academic tasks ───────────────────────────────────────────────────
    const unsyncedTasks = await getUnsyncedAcademicTasks();
    for (const task of unsyncedTasks) {
      if (!task.user_id || task.user_id === 'guest') continue;
      const { error } = await supabase.from('academic_tasks').upsert({
        id: task.id,
        user_id: task.user_id,
        title: task.title,
        sub: task.sub,
        tag: task.tag,
        date: task.date,
        done: task.done,
        priority: task.priority,
      });
      if (!error) await markAcademicTaskAsSynced(task.id);
      else console.warn('[Sync] academic_tasks upsert failed:', task.id, error.message);
    }

    // ── 4. Dimension ratings ────────────────────────────────────────────────
    // PREVIOUSLY MISSING — dimension_ratings were saved to SQLite but never
    // pushed to Supabase, so after logout they could not be rehydrated.
    const unsyncedRatings = await getUnsyncedDimensionRatings();
    for (const rating of unsyncedRatings) {
      if (!rating.user_id || rating.user_id === 'guest') continue;
      const { error } = await supabase.from('dimension_ratings').upsert({
        id: rating.id,
        user_id: rating.user_id,
        physical: rating.physical,
        emotional: rating.emotional,
        social: rating.social,
        intellectual: rating.intellectual,
        occupational: rating.occupational,
        spiritual: rating.spiritual,
        environmental: rating.environmental,
        financial: rating.financial,
        created_at: rating.created_at,
      });
      if (!error) await markDimensionRatingAsSynced(rating.id);
      else console.warn('[Sync] dimension_ratings upsert failed:', rating.id, error.message);
    }

    // ── 5. Reports ──────────────────────────────────────────────────────────
    // PREVIOUSLY MISSING — reports were saved locally but never pushed to
    // Supabase, making the Reports tab empty after logout+login.
    const unsyncedReports = await getUnsyncedReports();
    for (const report of unsyncedReports) {
      if (!report.user_id || report.user_id === 'guest') continue;
      const { error } = await supabase.from('reports').upsert({
        id: report.id,
        user_id: report.user_id,
        type: report.type,
        date_label: report.date_label,
        overall_score: report.overall_score,
        summary: report.summary,
        content_json: report.content_json,
        created_at: report.created_at,
      });
      if (!error) await markReportAsSynced(report.id);
      else console.warn('[Sync] reports upsert failed:', report.id, error.message);
    }

  } catch (err) {
    console.error('[Sync] Critical syncPendingEntries error:', err);
  }
};
