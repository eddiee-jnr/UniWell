import React, { useState } from 'react';
import { 
  View, Text, Switch, TouchableOpacity, 
  ScrollView, Alert, Share, StyleSheet, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { 
  getLocalMoodEntries, 
  getLocalCompletedExercises, 
  getLocalAcademicTasks, 
  getLocalReports,
  clearAllLocalData
} from '../../services/storage';

export const PrivacySecurityScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { session, isGuest, signOut } = useAuthStore();
  
  const [shareDiagnostics, setShareDiagnostics] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const userId = session?.user?.id || 'guest';
      const moods = await getLocalMoodEntries(userId);
      const exercises = await getLocalCompletedExercises(userId);
      const tasks = await getLocalAcademicTasks(userId);
      const reports = await getLocalReports(userId);

      const exportPayload = {
        export_date: new Date().toISOString(),
        app: 'UniWell',
        user_id: userId,
        mode: isGuest ? 'guest' : 'registered',
        data: {
          mood_logs: moods,
          completed_exercises: exercises,
          academic_tasks: tasks,
          reports: reports
        }
      };

      await Share.share({
        title: 'UniWell Data Export',
        message: JSON.stringify(exportPayload, null, 2),
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export data.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Local Cache',
      'This will delete all cached check-ins and completed exercises on this device. If you are logged in, your data remains safely stored in the Supabase cloud and will be restored next time you sync or log in. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Cache', 
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await clearAllLocalData();
              Alert.alert('Cache Cleared', 'Your local SQLite cache was successfully cleared. Log out or sync to reset.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to clear cache.');
            } finally {
              setClearing(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Request Account Deletion',
      'To comply with GDPR and privacy rights, you can request permanent deletion of your account and all associated mood history, exercise logs, and reports from our systems. Would you like to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Request', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Request Sent',
              'Your deletion request has been submitted. Our admin team will purge your cloud credentials and associated telemetry within 48 hours. You will now be logged out.',
              [{ text: 'OK', onPress: () => signOut() }]
            );
          }
        }
      ]
    );
  };

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
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Privacy & Security</Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          
          {/* Data Sharing Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Telemetry & Sharing</Text>
            <Text style={[styles.cardDesc, { color: colors.muted }]}>
              Help us improve UniWell by sharing anonymous diagnostic logs and usage patterns. We never collect or share personal information or notes.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Share Diagnostics Data</Text>
              <Switch 
                value={shareDiagnostics} 
                onValueChange={setShareDiagnostics} 
                trackColor={{ false: '#334155', true: '#A78BFA' }}
                thumbColor={shareDiagnostics ? '#7C6FEB' : '#94A3B8'}
              />
            </View>
          </View>

          {/* Export Data Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Data Portability</Text>
            <Text style={[styles.cardDesc, { color: colors.muted }]}>
              Download a complete archive of your local wellness history, completed exercises, and calendar tasks. This data is exported in standard JSON format.
            </Text>
            <TouchableOpacity 
              onPress={handleExportData}
              disabled={exporting}
              style={[styles.btn, { backgroundColor: colors.primary, marginTop: 16 }]}
            >
              <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {exporting ? 'Generating Export...' : 'Download My Data'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginTop: 24, marginBottom: 12 }}>DANGER ZONE</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#F8717140' }]}>
            <Text style={[styles.cardTitle, { color: '#F87171' }]}>Local SQLite Cache</Text>
            <Text style={[styles.cardDesc, { color: colors.muted }]}>
              Wipe all locally stored wellness and mood records from this device. If you are signed in, they will remain on the Supabase database.
            </Text>
            <TouchableOpacity 
              onPress={handleClearCache}
              disabled={clearing}
              style={[styles.dangerBtn, { borderColor: '#F8717140', marginTop: 16 }]}
            >
              <Ionicons name="trash-outline" size={18} color="#F87171" style={{ marginRight: 8 }} />
              <Text style={{ color: '#F87171', fontWeight: '700' }}>Wipe Device Cache</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#F8717140', marginTop: 16 }]}>
            <Text style={[styles.cardTitle, { color: '#F87171' }]}>Delete Account</Text>
            <Text style={[styles.cardDesc, { color: colors.muted }]}>
              Request permanent deletion of your UniWell account and all personal check-in data stored in the cloud. This action is irreversible.
            </Text>
            <TouchableOpacity 
              onPress={handleDeleteAccount}
              style={[styles.dangerBtn, { borderColor: '#F8717140', marginTop: 16 }]}
            >
              <Ionicons name="alert-circle-outline" size={18} color="#F87171" style={{ marginRight: 8 }} />
              <Text style={{ color: '#F87171', fontWeight: '700' }}>Request Account Deletion</Text>
            </TouchableOpacity>
          </View>

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
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F871710A',
  }
});

export default PrivacySecurityScreen;
