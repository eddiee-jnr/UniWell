import { supabase } from './supabase';
import { getUnsyncedEntries, markAsSynced } from './storage';

export const syncPendingEntries = async () => {
  try {
    const unsynced = await getUnsyncedEntries();
    if (unsynced.length === 0) return;

    for (const entry of unsynced) {
      // If user is guest, we don't sync to cloud yet
      if (!entry.user_id || entry.user_id === 'guest') continue;

      const { error } = await supabase.from('mood_logs').upsert({
        id: entry.id,
        user_id: entry.user_id,
        mood: entry.mood,
        stress: entry.stress,
        note: entry.note,
        created_at: entry.created_at,
      });

      if (!error) {
        await markAsSynced(entry.id);
      } else {
        console.warn('Sync failed for entry:', entry.id, error.message);
      }
    }
  } catch (err) {
    console.error('Critical sync error:', err);
  }
};
