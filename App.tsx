import './global.css';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initDatabase, seedAcademicCalendar } from './src/services/storage';
import { syncPendingEntries } from './src/services/syncService';
import { registerForPushNotificationsAsync, scheduleWellnessReminder } from './src/services/notificationService';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  useEffect(() => {
    const setupApp = async () => {
      try {
        await initDatabase();

        // Load stored SQLite entries into Zustand stores immediately for offline/instant launch
        const { useMoodStore } = await import('./src/store/moodStore');
        const { useAcademicStore } = await import('./src/store/academicStore');
        const { useTipsStore } = await import('./src/store/tipsStore');
        
        await useMoodStore.getState().loadEntries();
        await useAcademicStore.getState().loadTasks();
        await useTipsStore.getState().loadReadTips();

        await syncPendingEntries();

        const session = useAuthStore.getState().session;
        const profile = session?.user?.user_metadata;
        const isGimpa = profile?.institution === 'gimpa' || 
          session?.user?.email?.toLowerCase().endsWith('@st.gimpa.edu.gh') || 
          session?.user?.email?.toLowerCase().endsWith('@gimpa.edu.gh');
        
        if (session?.user?.id && isGimpa) {
          await seedAcademicCalendar(session.user.id, 'gimpa');
        }
      } catch (err) {
        console.error('App Setup Error:', err);
      }
    };
    
    setupApp();

    // Setup sync listener for background/foreground transitions
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncPendingEntries();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
