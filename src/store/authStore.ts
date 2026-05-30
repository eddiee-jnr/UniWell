import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  session: Session | null;
  isGuest: boolean;
  theme: 'dark' | 'light';
  userProfile: { name: string; preferred_name?: string; bio: string };
  // ── Rehydration state ──────────────────────────────────────────────────────
  // isRehydrating is true from the moment setSession fires until all Supabase
  // data has been written into local SQLite. The dashboard reads this flag to
  // show a loading screen instead of empty zeros.
  isRehydrating: boolean;
  rehydrationError: string | null;
  // ── Actions ────────────────────────────────────────────────────────────────
  setSession: (session: Session | null) => void;
  setIsGuest: (isGuest: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  updateProfile: (profile: { name: string; preferred_name?: string; bio: string }) => void;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

import { clearAllLocalData } from '../services/storage';

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isGuest: false,
  theme: 'dark',
  isRehydrating: false,
  rehydrationError: null,
  userProfile: { name: 'Guest User', preferred_name: undefined, bio: 'Exploring UniWell' },

  setSession: (session) => {
    const profile = session?.user?.user_metadata;

    // Immediately update the session and user profile in state.
    // Start with isRehydrating as false, and let the IIFE check if we need to block.
    set({
      session,
      isRehydrating: false,
      rehydrationError: null,
      userProfile: {
        name: profile?.full_name || session?.user?.email?.split('@')[0] || 'Student',
        preferred_name: profile?.preferred_name,
        bio: profile?.bio || '',
      },
    });

    if (session?.user?.id) {
      const userId = session.user.id;

      // ── Rehydration: Supabase → SQLite ──────────────────────────────────────
      // This is awaited inside an async IIFE so the store action itself stays
      // synchronous (Zustand requirement) while the async work is tracked.
      (async () => {
        try {
          const hasRehydratedKey = `has_rehydrated_${userId}`;
          const alreadyRehydrated = await AsyncStorage.getItem(hasRehydratedKey);

          const { rehydrateUserData } = await import('../services/syncService');
          const { useMoodStore } = await import('./moodStore');
          const { useAcademicStore } = await import('./academicStore');
          const { useTipsStore } = await import('./tipsStore');

          if (alreadyRehydrated === 'true') {
            console.log('[AuthStore] Pre-rehydrated. Bypassing rehydration loader screen.');
            
            // Perform background rehydration silently to pull fresh updates without blocking UI
            rehydrateUserData(userId).then(async () => {
              await useMoodStore.getState().loadEntries();
              await useAcademicStore.getState().loadTasks();
              await useTipsStore.getState().loadReadTips();
              console.log('[AuthStore] Background rehydration complete. Zustand stores updated.');
            }).catch(err => console.warn('[AuthStore] Background rehydration warning:', err));

          } else {
            // First time logging in on this device. Block UI to fetch everything.
            set({ isRehydrating: true });
            await rehydrateUserData(userId);
            await AsyncStorage.setItem(hasRehydratedKey, 'true');
            console.log('[AuthStore] First-time rehydration complete.');

            // Refresh in-memory Zustand store state from the newly written SQLite data.
            await useMoodStore.getState().loadEntries();
            await useAcademicStore.getState().loadTasks();
            await useTipsStore.getState().loadReadTips();
            set({ isRehydrating: false });
          }

          // Restore read tips from Supabase so the ✓ checkmarks and tips count
          // are correct immediately after login without waiting for the dashboard
          // to run its own Supabase count fallback.
          try {
            const { supabase: sb } = await import('../services/supabase');
            const { data: tipRows } = await sb
              .from('tip_engagements')
              .select('tip_id')
              .eq('user_id', userId);
            if (tipRows && tipRows.length > 0) {
              useTipsStore.getState().setReadTips(tipRows.map((r: any) => r.tip_id));
              console.log(`[AuthStore] Restored ${tipRows.length} read tip IDs into tipsStore`);
            }
          } catch (tipErr) {
            console.warn('[AuthStore] Could not restore tips from Supabase:', tipErr);
          }

          // ── Notification Setup on Login/Rehydration ───────────────────────
          (async () => {
            try {
              const { requestPermissions, scheduleWellnessCheckInReminder, cancelAllNotifications } = await import('../services/notificationService');
              const granted = await requestPermissions();
              if (granted) {
                // Cancel existing to prevent duplicates
                await cancelAllNotifications();
                
                // Get preferred time or fallback to default '20:00'
                const userMeta = session.user.user_metadata;
                const dailyPref = userMeta?.notification_pref_daily !== false;
                if (dailyPref) {
                  const dailyTime = userMeta?.notification_pref_daily_time || '20:00';
                  await scheduleWellnessCheckInReminder(dailyTime);
                  console.log(`[AuthStore] Notification scheduled successfully at ${dailyTime}`);
                } else {
                  console.log('[AuthStore] Daily notification is disabled by user preference');
                }
              } else {
                console.log('[AuthStore] Notification permissions not granted');
              }
            } catch (notifErr) {
              console.warn('[AuthStore] Failed to setup notifications:', notifErr);
            }
          })();
        } catch (err: any) {
          console.error('[AuthStore] Rehydration failed:', err.message);
          set({ isRehydrating: false, rehydrationError: err.message ?? 'Failed to restore data' });
        }
      })();

      // ── Auto-seed GIMPA academic calendar ────────────────────────────────────
      const isGimpa =
        profile?.institution === 'gimpa' ||
        session?.user?.email?.toLowerCase().endsWith('@st.gimpa.edu.gh') ||
        session?.user?.email?.toLowerCase().endsWith('@gimpa.edu.gh');

      if (isGimpa) {
        import('../services/storage').then(({ seedAcademicCalendar }) => {
          seedAcademicCalendar(userId, 'gimpa').catch(console.error);
        });
      }
    }
  },

  setIsGuest: (isGuest) => set({ isGuest }),
  setTheme: (theme) => set({ theme }),
  updateProfile: (userProfile) => set({ userProfile }),

  signInAnonymously: async () => {
    // Guest mode: clear local data so they see a clean slate, then set guest flag.
    // This does NOT touch Supabase — it only clears the device's local SQLite cache.
    await clearAllLocalData();
    set({
      isGuest: true,
      isRehydrating: false,
      rehydrationError: null,
      userProfile: { name: 'Guest User', bio: 'Exploring UniWell' },
    });
  },

  signOut: async () => {
    // ── Logout audit ────────────────────────────────────────────────────────
    const session = get().session;
    if (session?.user?.id) {
      await AsyncStorage.removeItem(`has_rehydrated_${session.user.id}`).catch(console.error);
    }
    await supabase.auth.signOut();
    import('../services/notificationService').then(({ cancelAllNotifications }) => {
      cancelAllNotifications().catch(console.error);
    });
    set({ session: null, isGuest: false, isRehydrating: false, rehydrationError: null });
  },
}));
