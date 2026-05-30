import { create } from 'zustand';
import { AcademicTask } from '../types';
import { 
  saveAcademicTaskLocally, 
  getLocalAcademicTasks, 
  updateAcademicTaskLocally, 
  deleteLocalAcademicTask 
} from '../services/storage';
import { syncPendingEntries } from '../services/syncService';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';

interface AcademicState {
  tasks: AcademicTask[];
  loading: boolean;
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<AcademicTask, 'id' | 'user_id' | 'done'>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  tasks: [],
  loading: false,

  loadTasks: async () => {
    set({ loading: true });
    try {
      const session = useAuthStore.getState().session;
      const userId = session?.user.id || 'guest';
      const localTasks = await getLocalAcademicTasks(userId);
      set({ tasks: localTasks });
    } catch (error) {
      console.error('Failed to load academic tasks:', error);
    } finally {
      set({ loading: false });
    }
  },

  addTask: async (taskData) => {
    const session = useAuthStore.getState().session;
    const userId = session?.user?.id || 'guest';
    
    let notificationId: string | undefined = undefined;
    const alertOpt = taskData.alert_trigger || 'none';
    
    if (alertOpt !== 'none') {
      try {
        const { scheduleCustomReminder } = await import('../services/notificationService');
        notificationId = await scheduleCustomReminder(taskData.title, taskData.date, alertOpt);
      } catch (err) {
        console.warn('Failed to schedule reminder:', err);
      }
    }

    const newTask: AcademicTask = {
      ...taskData,
      id: Math.random().toString(36).substring(7),
      user_id: userId,
      done: false,
      alert_trigger: alertOpt,
      notification_id: notificationId,
    };

    // Update local state immediately
    set({ tasks: [...get().tasks, newTask] });

    // Background saving & syncing
    (async () => {
      try {
        // Save locally
        await saveAcademicTaskLocally(newTask);
        
        // Sync
        syncPendingEntries().catch(err => console.warn('[academicStore] Background sync error:', err));
      } catch (err) {
        console.error('[academicStore] Failed to save added task:', err);
      }
    })();
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newDone = !task.done;

    if (newDone && task.notification_id) {
      try {
        const { cancelNotificationById } = await import('../services/notificationService');
        cancelNotificationById(task.notification_id).catch(console.error);
      } catch (err) {
        console.warn('Failed to cancel notification on complete:', err);
      }
    }

    // Update local state immediately (Optimistic Update)
    set({
      tasks: get().tasks.map((t) => (t.id === id ? { ...t, done: newDone, notification_id: newDone ? undefined : t.notification_id } : t)),
    });

    // Run database writes and sync in background
    (async () => {
      try {
        // Update locally
        await updateAcademicTaskLocally(id, newDone);

        // If online, update in Supabase
        const session = useAuthStore.getState().session;
        if (session && task.user_id !== 'guest') {
          await supabase.from('academic_tasks').update({ done: newDone }).eq('id', id);
        }
        
        // Sync
        syncPendingEntries().catch(err => console.warn('[academicStore] Background sync error:', err));
      } catch (err) {
        console.error('[academicStore] Failed to toggle task:', err);
      }
    })();
  },

  deleteTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    if (task.notification_id) {
      try {
        const { cancelNotificationById } = await import('../services/notificationService');
        cancelNotificationById(task.notification_id).catch(console.error);
      } catch (err) {
        console.warn('Failed to cancel notification on delete:', err);
      }
    }

    // Update local state immediately (Optimistic Deletion)
    set({ tasks: get().tasks.filter((t) => t.id !== id) });

    // Run database writes in background
    (async () => {
      try {
        await deleteLocalAcademicTask(id);

        const session = useAuthStore.getState().session;
        if (session && task.user_id !== 'guest') {
          await supabase.from('academic_tasks').delete().eq('id', id);
        }
      } catch (err) {
        console.error('[academicStore] Failed to delete task:', err);
      }
    })();
  },
}));
