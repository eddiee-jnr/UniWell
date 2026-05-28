import React, { useState, useEffect } from 'react';
import { 
  View, Text, Switch, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, StyleSheet, Modal, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../services/supabase';
import { 
  scheduleWellnessCheckInReminder, 
  cancelAllNotifications, 
  scheduleDeadlineReminder,
  requestPermissions
} from '../../services/notificationService';
import { getLocalCalendarEvents } from '../../services/storage';

export const NotificationsSettingsScreen = () => {
  const navigation = useNavigation();
  const { colors, theme } = useTheme();
  const { session } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [daily, setDaily] = useState(true);
  const [dailyTime, setDailyTime] = useState('20:00');
  const [exams, setExams] = useState(true);
  const [weekly, setWeekly] = useState(true);
  const [monthly, setMonthly] = useState(true);
  const [nudges, setNudges] = useState(true);
  
  // Custom Time Picker Modal State
  const [isTimeModalVisible, setTimeModalVisible] = useState(false);
  
  useEffect(() => {
    if (session?.user?.user_metadata) {
      const meta = session.user.user_metadata;
      setDaily(meta.notification_pref_daily !== false);
      setDailyTime(meta.notification_pref_daily_time || '20:00');
      setExams(meta.notification_pref_exams !== false);
      setWeekly(meta.notification_pref_weekly !== false);
      setMonthly(meta.notification_pref_monthly !== false);
      setNudges(meta.notification_pref_nudges !== false);
    }
  }, [session]);
  
  const handleSave = async (
    newDaily: boolean, 
    newDailyTime: string, 
    newExams: boolean, 
    newWeekly: boolean, 
    newMonthly: boolean, 
    newNudges: boolean
  ) => {
    setLoading(true);
    try {
      // 1. Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          notification_pref_daily: newDaily,
          notification_pref_daily_time: newDailyTime,
          notification_pref_exams: newExams,
          notification_pref_weekly: newWeekly,
          notification_pref_monthly: newMonthly,
          notification_pref_nudges: newNudges
        }
      });
      
      if (error) throw error;
      
      // Request permissions if any reminder is enabled
      if (newDaily || newExams || newWeekly || newMonthly || newNudges) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permissions Required',
            'Notifications are currently disabled. Please enable them in your device Settings to receive reminders.',
            [{ text: 'OK' }]
          );
        }
      }
      
      // 2. Sync local scheduled notifications with new preferences
      await cancelAllNotifications();
      
      if (newDaily) {
        await scheduleWellnessCheckInReminder(newDailyTime);
      }
      
      if (newExams && session?.user?.id) {
        // Fetch academic events from local SQLite and reschedule deadline reminders
        const events = await getLocalCalendarEvents(session.user.id);
        for (const event of events) {
          if (event.type === 'exam' || event.type === 'deadline') {
            await scheduleDeadlineReminder(event.title, event.date);
          }
        }
      }
      
    } catch (err: any) {
      console.error('Error saving notification preferences:', err);
      Alert.alert('Error', err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleDaily = (val: boolean) => {
    setDaily(val);
    handleSave(val, dailyTime, exams, weekly, monthly, nudges);
  };
  
  const toggleExams = (val: boolean) => {
    setExams(val);
    handleSave(daily, dailyTime, val, weekly, monthly, nudges);
  };
  
  const toggleWeekly = (val: boolean) => {
    setWeekly(val);
    handleSave(daily, dailyTime, exams, val, monthly, nudges);
  };
  
  const toggleMonthly = (val: boolean) => {
    setMonthly(val);
    handleSave(daily, dailyTime, exams, weekly, val, nudges);
  };
  
  const toggleNudges = (val: boolean) => {
    setNudges(val);
    handleSave(daily, dailyTime, exams, weekly, monthly, val);
  };
  
  const selectTime = (time: string) => {
    setDailyTime(time);
    setTimeModalVisible(false);
    handleSave(daily, time, exams, weekly, monthly, nudges);
  };
  
  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const times = hoursList.map(h => `${h}:00`);
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ 
              width: 40, height: 40, borderRadius: 20, 
              backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', 
              borderWidth: 1, borderColor: colors.border, marginRight: 16 
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Notification Settings</Text>
        </View>
        
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          
          {/* Daily check in */}
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Daily Wellness Check-in</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>Receive a notification reminder to log your daily mood and stress levels.</Text>
              </View>
              <Switch 
                value={daily} 
                onValueChange={toggleDaily} 
                trackColor={{ false: '#334155', true: '#A78BFA' }}
                thumbColor={daily ? '#7C6FEB' : '#94A3B8'}
              />
            </View>
            
            {daily && (
              <TouchableOpacity 
                onPress={() => setTimeModalVisible(true)}
                style={[styles.timePickerBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Ionicons name="time-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.text, fontWeight: '600' }}>Reminder Time: {dailyTime}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.muted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Exams and deadlines */}
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Exams & Deadlines</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>Get notified 7 days and 1 day before your exams, course assignments, or registration deadlines.</Text>
              </View>
              <Switch 
                value={exams} 
                onValueChange={toggleExams} 
                trackColor={{ false: '#334155', true: '#A78BFA' }}
                thumbColor={exams ? '#7C6FEB' : '#94A3B8'}
              />
            </View>
          </View>
          
          {/* Weekly reports */}
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Weekly Report Alerts</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>Receive an alert when your weekly student wellness reports are compiled.</Text>
              </View>
              <Switch 
                value={weekly} 
                onValueChange={toggleWeekly} 
                trackColor={{ false: '#334155', true: '#A78BFA' }}
                thumbColor={weekly ? '#7C6FEB' : '#94A3B8'}
              />
            </View>
          </View>
          
          {/* Monthly reports */}
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Monthly Report Alerts</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>Receive an alert at the start of each month once your monthly report is generated.</Text>
              </View>
              <Switch 
                value={monthly} 
                onValueChange={toggleMonthly} 
                trackColor={{ false: '#334155', true: '#A78BFA' }}
                thumbColor={monthly ? '#7C6FEB' : '#94A3B8'}
              />
            </View>
          </View>
          
          {/* Exam count down nudges */}
          <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Exam Countdown Nudges</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>Receive stress management and breathing exercise nudges when exams are 3 days away.</Text>
              </View>
              <Switch 
                value={nudges} 
                onValueChange={toggleNudges} 
                trackColor={{ false: '#334155', true: '#A78BFA' }}
                thumbColor={nudges ? '#7C6FEB' : '#94A3B8'}
              />
            </View>
          </View>
          
          {loading && (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          )}
          
        </View>
      </ScrollView>
      
      {/* Time Picker Modal */}
      <Modal
        visible={isTimeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Reminder Time</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {times.map(t => (
                <TouchableOpacity 
                  key={t}
                  onPress={() => selectTime(t)}
                  style={[styles.timeOption, { borderBottomColor: colors.border }]}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: dailyTime === t ? '800' : '500' }}>{t}</Text>
                  {dailyTime === t && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              onPress={() => setTimeModalVisible(false)}
              style={[styles.closeBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
    </View>
  );
};

const styles = StyleSheet.create({
  settingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  timePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  }
});
