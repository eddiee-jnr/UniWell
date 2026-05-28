import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { syncPendingEntries } from '../../services/syncService';
import { 
  getUnsyncedEntries, 
  getUnsyncedCompletedExercises, 
  getUnsyncedAcademicTasks,
  getUnsyncedDimensionRatings,
  getUnsyncedReports
} from '../../services/storage';

export const DataIntegrationScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { session, isGuest, signOut } = useAuthStore();
  
  const [syncing, setSyncing] = useState(false);
  const [counts, setCounts] = useState({
    moods: 0,
    exercises: 0,
    tasks: 0,
    dimensions: 0,
    reports: 0
  });

  const loadUnsyncedCounts = async () => {
    try {
      const moods = await getUnsyncedEntries();
      const exercises = await getUnsyncedCompletedExercises();
      const tasks = await getUnsyncedAcademicTasks();
      const dimensions = await getUnsyncedDimensionRatings();
      const reports = await getUnsyncedReports();

      setCounts({
        moods: moods.length,
        exercises: exercises.length,
        tasks: tasks.length,
        dimensions: dimensions.length,
        reports: reports.length
      });
    } catch (err) {
      console.warn('Failed to load unsynced counts:', err);
    }
  };

  useEffect(() => {
    loadUnsyncedCounts();
  }, []);

  const handleSyncNow = async () => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Local data is kept offline in Guest Mode. Please create an account to sync data to the cloud.');
      return;
    }
    
    setSyncing(true);
    try {
      await syncPendingEntries();
      await loadUnsyncedCounts();
      Alert.alert('Sync Successful', 'All your local wellness history is now fully synced to Supabase.');
    } catch (err: any) {
      Alert.alert('Sync Failed', err.message || 'Could not sync entries.');
    } finally {
      setSyncing(false);
    }
  };

  const totalUnsynced = counts.moods + counts.exercises + counts.tasks + counts.dimensions + counts.reports;

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
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Data Integration</Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          
          {/* Connection Status Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>Cloud Status</Text>
              <View style={[styles.badge, { 
                backgroundColor: isGuest ? '#F59E0B20' : '#10B98120', 
                borderColor: isGuest ? '#F59E0B60' : '#10B98160' 
              }]}>
                <View style={[styles.dot, { backgroundColor: isGuest ? '#F59E0B' : '#10B981' }]} />
                <Text style={{ color: isGuest ? '#F59E0B' : '#10B981', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                  {isGuest ? 'Offline / Guest' : 'Connected'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardDesc, { color: colors.muted }]}>
              {isGuest 
                ? 'Your device is operating in local Guest Mode. None of your data is backed up. Register an account to protect your logs.'
                : `Connected to Supabase cloud. Local SQLite records are actively pushed to the cloud whenever you have network access.`}
            </Text>
          </View>

          {/* Sync Stats Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Sync Queue</Text>
            <Text style={[styles.cardDesc, { color: colors.muted, marginBottom: 16 }]}>
              The counts below represent wellness data generated on this device that has not yet finished uploading to your cloud profile.
            </Text>

            {[
              { label: 'Mood & Stress Logs', count: counts.moods },
              { label: 'Completed Exercises', count: counts.exercises },
              { label: 'Academic Tasks & Events', count: counts.tasks },
              { label: 'Dimension Self-Assessments', count: counts.dimensions },
              { label: 'Generated Wellness Reports', count: counts.reports },
            ].map((item, idx) => (
              <View key={idx} style={[styles.queueRow, { borderBottomColor: colors.border }]}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>{item.label}</Text>
                <View style={{ backgroundColor: item.count > 0 ? colors.primary + '20' : colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: item.count > 0 ? colors.primary : colors.muted, fontSize: 11, fontWeight: '700' }}>
                    {item.count} pending
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity 
              onPress={handleSyncNow}
              disabled={syncing || (totalUnsynced === 0 && !isGuest)}
              style={[
                styles.btn, 
                { 
                  backgroundColor: totalUnsynced > 0 ? colors.primary : colors.surface, 
                  borderColor: colors.border,
                  borderWidth: totalUnsynced > 0 ? 0 : 1,
                  marginTop: 20 
                }
              ]}
            >
              {syncing ? (
                <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons 
                  name="sync-outline" 
                  size={18} 
                  color={totalUnsynced > 0 ? '#fff' : colors.muted} 
                  style={{ marginRight: 8 }} 
                />
              )}
              <Text style={{ 
                color: totalUnsynced > 0 ? '#fff' : colors.muted, 
                fontWeight: '700' 
              }}>
                {syncing ? 'Syncing Logs...' : totalUnsynced > 0 ? 'Sync Now' : 'All Data Synced'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Guest Action Callout */}
          {isGuest && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#F59E0B40', marginTop: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="cloud-upload-outline" size={24} color="#F59E0B" style={{ marginRight: 10 }} />
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Backup Your Progress</Text>
              </View>
              <Text style={[styles.cardDesc, { color: colors.muted, marginBottom: 16 }]}>
                Do not risk losing your week streak, exercises, or reports. Upgrade your account today to enable automated backing up and sync across all devices.
              </Text>
              <TouchableOpacity 
                onPress={() => signOut()}
                style={[styles.btn, { backgroundColor: '#F59E0B' }]}
              >
                <Text style={{ color: '#1E293B', fontWeight: '800' }}>Sign Up / Register</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  }
});

export default DataIntegrationScreen;
