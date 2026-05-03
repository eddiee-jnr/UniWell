import './global.css';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initDatabase } from './src/services/storage';
import { syncPendingEntries } from './src/services/syncService';
import { registerForPushNotificationsAsync, scheduleWellnessReminder } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    const setupApp = async () => {
      try {
        await initDatabase();
        await syncPendingEntries();
        /* 
        const hasPermission = await registerForPushNotificationsAsync();
        if (hasPermission) {
          // Schedule a gentle reminder for 1 hour from now (mocking the system nudge)
          await scheduleWellnessReminder(
            "UniWell Focus Check 🧠",
            "You've been studying hard! How about a 2-minute breathing break?",
            3600
          );
        }
        */
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
