import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useWellnessScore } from '../../hooks/useWellnessScore';
import { MoodLineChart } from '../../components/charts/MoodLineChart';
import { StressHeatmap } from '../../components/charts/StressHeatmap';
import { RadarChart } from '../../components/charts/RadarChart';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';

interface StatCardProps {
  icon: string;
  iconLib: 'Ionicons' | 'Material';
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconLib, label, value, color, onPress }) => {
  const { colors } = useTheme();
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container 
      onPress={onPress}
      style={{
        flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16,
        alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginHorizontal: 4,
        position: 'relative',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
      }}
    >
      {onPress && (
        <Ionicons 
          name="chevron-forward" 
          size={12} 
          color={colors.muted} 
          style={{ position: 'absolute', top: 12, right: 12 }} 
        />
      )}
      {iconLib === 'Ionicons'
        ? <Ionicons name={icon as any} size={24} color={color} style={{ marginBottom: 8 }} />
        : <MaterialCommunityIcons name={icon as any} size={24} color={color} style={{ marginBottom: 8 }} />
      }
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 2 }}>
        {value}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </Container>
  );
};

import { Alert } from 'react-native';

import { checkAndGenerateReports } from '../../services/reportGenerator';
import exercisesData from '../../data/exercises.json';
import { getLocalCalendarEvents, CalendarEvent } from '../../services/storage';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, theme } = useTheme();
  const { userProfile, isGuest, session, isRehydrating, rehydrationError } = useAuthStore();
  const wellnessData = useWellnessScore();
  const { 
    last7Days, 
    allEntries,
    allExercises,
    avgStress, 
    tipsReadCount, 
    streakCount, 
    completedExercisesCount, 
    dimensions, 
    dimensions7Days,
    dimensions30Days,
    dimensionsAllTime,
    hasBaseline, 
    showAssessmentCTA, 
    loading, 
    error 
  } = wellnessData;
  const tabBarHeight = useBottomTabBarHeight();

  const [academicEvents, setAcademicEvents] = useState<CalendarEvent[]>([]);
  const [newReportAlert, setNewReportAlert] = useState<{ type: string; id: string } | null>(null);
  const [radarRange, setRadarRange] = useState<'7days' | '30days' | 'all'>('7days');

  React.useEffect(() => {
    if (!isGuest && !loading && hasBaseline) {
      checkAndGenerateReports(session?.user.id || 'guest', wellnessData).then(report => {
        if (report) setNewReportAlert(report);
      });
    }
  }, [loading, hasBaseline, isGuest]);

  React.useEffect(() => {
    if (!isGuest && (session?.user?.user_metadata?.institution === 'gimpa' || session?.user?.email?.toLowerCase().endsWith('@st.gimpa.edu.gh') || session?.user?.email?.toLowerCase().endsWith('@gimpa.edu.gh'))) {
      getLocalCalendarEvents(session?.user.id || 'guest').then(setAcademicEvents);
    }
  }, [isGuest, userProfile, session]);

  const showHighStressAlert = avgStress >= 7 && last7Days.length > 0;

  // Smart Nudge Logic
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = academicEvents.filter(e => e.date >= todayStr);
  let activeNudge = null;

  for (const event of upcomingEvents) {
    const eventStart = new Date(event.date);
    const today = new Date(todayStr);
    const diffTime = eventStart.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0 && event.type === 'holiday') {
      activeNudge = {
        title: 'Holiday Reset',
        message: "You've got a free day today. Use it to recharge.",
        exerciseName: 'Deep Relaxation',
        color: '#4ADE80',
        icon: 'beach'
      };
      break;
    } else if (diffDays === 1 && event.type === 'deadline') {
      activeNudge = {
        title: 'Deadline Eve',
        message: "Big deadline tomorrow. Don't forget to rest tonight.",
        exerciseName: 'Deep Relaxation',
        color: '#FBBF24',
        icon: 'clock-alert-outline'
      };
      break;
    } else if (diffDays <= 7 && event.type === 'exam') {

      activeNudge = {
        title: 'Exam Season Prep',
        message: "Exams are coming up. Try a 3-breath reset to stay grounded.",
        exerciseName: '3-Breath Reset',
        color: '#F87171',
        icon: 'brain'
      };
      break;
    }
  }

  const handleBeginNudgeExercise = () => {
    if (!activeNudge) return;
    // For "3-Breath Reset", if it doesn't exist, fallback to "Box Breathing"
    const exercise = exercisesData.find(ex => ex.title === activeNudge.exerciseName) || exercisesData[0];
    navigation.getParent()?.navigate('ExercisePlayer', { exercise });
  };

  // Weekly Tier 2 Refresh Nudge Logic
  const [showWeeklyRefresh, setShowWeeklyRefresh] = useState(false);
  React.useEffect(() => {
    if (!isGuest) {
      const today = new Date();
      if (today.getDay() === 0) { // Sunday
        import('../../services/storage').then(({ getLatestDimensionRatings }) => {
          const currentSession = useAuthStore.getState().session;
          getLatestDimensionRatings(currentSession?.user.id || 'guest').then((latest) => {
            if (latest) {
              const latestDate = new Date(latest.created_at).toISOString().split('T')[0];
              if (latestDate !== todayStr) {
                setShowWeeklyRefresh(true);
              }
            }
          });
        });
      }
    }
  }, [isGuest, todayStr]);

  const handleBeginWeeklyRefresh = () => {
    navigation.navigate('WeeklyRefresh'); // We need to create this screen
  };


  // ── State 1: Rehydrating — cloud data is still being written to SQLite ──────
  // Show a branded loading screen. Never show zeros or empty charts here.
  if (isRehydrating && !isGuest) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Ionicons name="leaf" size={36} color={colors.primary} />
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 10 }}>
          Restoring your data
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
          Fetching your mood history, wellness scores, and records from the cloud. This only takes a moment.
        </Text>
      </View>
    );
  }

  // ── State 2: Rehydration failed — show error with retry ─────────────────────
  if (rehydrationError && !isGuest) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Ionicons name="cloud-offline-outline" size={56} color="#FBBF24" style={{ marginBottom: 20 }} />
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 10 }}>
          Could not load your data
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28 }}>
          Please check your internet connection and try again. Your data is safe in the cloud.
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (session?.user?.id) {
              useAuthStore.setState({ isRehydrating: true, rehydrationError: null });
              import('../../services/syncService').then(({ rehydrateUserData }) => {
                rehydrateUserData(session.user.id)
                  .then(() => useAuthStore.setState({ isRehydrating: false }))
                  .catch((err: any) => useAuthStore.setState({ isRehydrating: false, rehydrationError: err.message }));
              });
            }
          }}
          style={{ backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── State 3: useWellnessScore still loading local SQLite ─────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 16, fontSize: 14 }}>Loading your wellness data...</Text>
      </View>
    );
  }

  // Calculate strongest and lowest dimensions
  const dimsList = [
    { name: 'Physical', value: dimensions?.physical ?? 0 },
    { name: 'Emotional', value: dimensions?.emotional ?? 0 },
    { name: 'Social', value: dimensions?.social ?? 0 },
    { name: 'Intellectual', value: dimensions?.intellectual ?? 0 },
    { name: 'Occupational', value: dimensions?.occupational ?? 0 },
    { name: 'Spiritual', value: dimensions?.spiritual ?? 0 },
    { name: 'Environmental', value: dimensions?.environmental ?? 0 },
    { name: 'Financial', value: dimensions?.financial ?? 0 },
  ];
  
  const sortedDims = [...dimsList].sort((a, b) => b.value - a.value);
  const strongestDim = sortedDims[0];
  const lowestDim = sortedDims[sortedDims.length - 1];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10,
            }}>
              <Ionicons name="leaf" size={18} color="#fff" />
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              {isGuest 
                ? 'Guest Mode' 
                : `Hi, ${userProfile?.preferred_name || userProfile?.name?.split(' ')[0] || 'there'}`}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Profile')}
              style={{ 
                width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
                alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border
              }}
            >
              <Ionicons name="person" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Title */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 4 }}>
            Wellness Dashboard
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Your personal health analytics
          </Text>
        </View>

        {/* Smart Nudge Card */}
        {activeNudge && !isGuest && (
          <View style={{ marginHorizontal: 20, backgroundColor: activeNudge.color + '15', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: activeNudge.color + '40', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <MaterialCommunityIcons name={activeNudge.icon as any} size={24} color={activeNudge.color} style={{ marginRight: 10 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{activeNudge.title}</Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              {activeNudge.message}
            </Text>
            <TouchableOpacity 
              onPress={handleBeginNudgeExercise}
              style={{ backgroundColor: activeNudge.color, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Begin Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weekly Tier 2 Refresh Nudge */}
        {showWeeklyRefresh && hasBaseline && (
          <View style={{ marginHorizontal: 20, backgroundColor: colors.dimSpiritual + '15', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.dimSpiritual + '40', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <MaterialCommunityIcons name="refresh-circle" size={26} color={colors.dimSpiritual} style={{ marginRight: 10 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Sunday Refresh</Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              It's Sunday! Take 30 seconds to update your Spiritual, Environmental, and Financial wellness scores to keep your radar chart accurate.
            </Text>
            <TouchableOpacity 
              onPress={handleBeginWeeklyRefresh}
              style={{ backgroundColor: colors.dimSpiritual, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Quick Check-in</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Banner */}
        {error && !isGuest && (
          <View style={{
            marginHorizontal: 20, marginBottom: 16,
            backgroundColor: '#FBBF2415', borderRadius: 14, padding: 14,
            borderWidth: 1, borderColor: '#FBBF2440',
            flexDirection: 'row', alignItems: 'center',
          }}>
            <Ionicons name="warning-outline" size={18} color="#FBBF24" style={{ marginRight: 10 }} />
            <Text style={{ color: '#FBBF24', fontSize: 13, flex: 1 }}>
              Showing local data. Connect to internet to sync.
            </Text>
          </View>
        )}

        {/* Guest CTA Card */}
        {isGuest && (
          <View style={{
            marginHorizontal: 20, marginBottom: 24,
            backgroundColor: colors.surface, borderRadius: 20, padding: 20,
            borderWidth: 1, borderColor: colors.border,
            alignItems: 'center',
          }}>
            <Ionicons name="star" size={32} color="#F59E0B" style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
              Unlock Your Full Journey
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 20 }}>
              Create an account to track your streaks, exercises, and progress over time.
            </Text>
            <TouchableOpacity 
              onPress={() => {
                useAuthStore.getState().signOut();
              }}
              style={{
                backgroundColor: colors.primary, borderRadius: 12,
                paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center',
              }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Sign Up Free</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stat Cards */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 24 }}>
          {!isGuest && (
            <StatCard
              icon="flame"
              iconLib="Ionicons"
              label="DAY STREAK"
              value={streakCount}
              color="#FBBF24"
            />
          )}
          <StatCard
            icon="dumbbell"
            iconLib="Material"
            label="EXERCISES"
            value={completedExercisesCount}
            color="#38BDF8"
            onPress={() => navigation.navigate('Exercises')}
          />
          <StatCard
            icon="book-outline"
            iconLib="Ionicons"
            label="READ TIPS"
            value={tipsReadCount}
            color="#4ADE80"
            onPress={() => navigation.navigate('Tips')}
          />
        </View>

        {/* Charts */}
        <View style={{
          marginHorizontal: 20, marginBottom: 24,
          backgroundColor: colors.surface, borderRadius: 20, padding: 20,
          borderWidth: 1, borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="trending-up" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
              Mood History
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16 }}>
            Scale: 1 (Low) → 5 (Great)
          </Text>
          <MoodLineChart entries={allEntries} />
        </View>

        <View style={{
          marginHorizontal: 20, marginBottom: 24,
          backgroundColor: colors.surface, borderRadius: 20, padding: 20,
          borderWidth: 1, borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="grid" size={18} color="#F472B6" style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
              Stress Heatmap
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16 }}>
            Color intensity reflects daily stress level
          </Text>
          <StressHeatmap entries={allEntries} />
        </View>

        {/* Assessment Call to Action */}
        {showAssessmentCTA && (
          <View style={{
            marginHorizontal: 20, marginBottom: 24,
            backgroundColor: colors.primary + '15', borderRadius: 20, padding: 20,
            borderWidth: 1, borderColor: colors.primary + '40',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12
              }}>
                <MaterialCommunityIcons name="creation" size={20} color="#fff" />
              </View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                {!hasBaseline ? 'Set Your Baseline' : 'Log Your Daily Wellness'}
              </Text>
            </View>
            <Text style={{ color: colors.secondary, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              {!hasBaseline 
                ? 'Your wellness metrics are empty. Take our 2-minute baseline test to calibrate your personal sanctuary across 8 dimensions.'
                : 'Keep your sanctuary up to date! Log your emotions and assess your 8 dimensions of wellness for today.'}
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('WellnessAssessment')}
              style={{
                backgroundColor: colors.primary, borderRadius: 12,
                paddingVertical: 14, alignItems: 'center',
              }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{!hasBaseline ? 'Start Assessment' : 'Take Daily Assessment'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dimensions of Wellness - Radar Chart */}
        <View style={{
          marginHorizontal: 20, marginBottom: 24,
          backgroundColor: colors.surface, borderRadius: 20, padding: 24,
          borderWidth: 1, borderColor: colors.border,
          alignItems: 'center',
        }}>
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>
                Dimensions of Wellness
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {!hasBaseline 
                  ? 'Take the assessment to unlock these health pillars' 
                  : 'Your balance across key health pillars'}
              </Text>
            </View>
            {hasBaseline && (
              <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.background, padding: 3, borderRadius: 8 }}>
                {(['7days', '30days', 'all'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRadarRange(r)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: radarRange === r ? colors.primary : 'transparent',
                    }}
                  >
                    <Text style={{ 
                      fontSize: 10, 
                      fontWeight: '700', 
                      color: radarRange === r ? '#fff' : colors.muted 
                    }}>
                      {r === '7days' ? '7D' : r === '30days' ? '30D' : 'All'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <RadarChart 
            dimensions={
              radarRange === '7days' ? dimensions7Days : 
              radarRange === '30days' ? dimensions30Days : 
              dimensionsAllTime
            } 
            size={Dimensions.get('window').width - 80} 
          />

          <View style={{ 
            flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', 
            marginTop: 40, width: '100%' 
          }}>
            {[
              { label: 'Physical', value: (radarRange === '7days' ? dimensions7Days : radarRange === '30days' ? dimensions30Days : dimensionsAllTime)?.physical ?? 0, color: colors.dimPhysical },
              { label: 'Emotional', value: (radarRange === '7days' ? dimensions7Days : radarRange === '30days' ? dimensions30Days : dimensionsAllTime)?.emotional ?? 0, color: colors.dimEmotional },
              { label: 'Social', value: (radarRange === '7days' ? dimensions7Days : radarRange === '30days' ? dimensions30Days : dimensionsAllTime)?.social ?? 0, color: colors.dimSocial },
              { label: 'Intellectual', value: (radarRange === '7days' ? dimensions7Days : radarRange === '30days' ? dimensions30Days : dimensionsAllTime)?.intellectual ?? 0, color: colors.dimIntellectual },
              { label: 'Occupational', value: (radarRange === '7days' ? dimensions7Days : radarRange === '30days' ? dimensions30Days : dimensionsAllTime)?.occupational ?? 0, color: colors.dimOccupational },
              { label: 'Spiritual', value: (radarRange === '7days' ? dimensions7Days : radarRange === '30days' ? dimensions30Days : dimensionsAllTime)?.spiritual ?? 0, color: colors.dimSpiritual },
              { label: 'Environmental', value: (radarRange === '7days' ? dimensions7Days : radarRange === '30days' ? dimensions30Days : dimensionsAllTime)?.environmental ?? 0, color: colors.dimEnvironmental },
              { label: 'Financial', value: (radarRange === '7days' ? dimensions7Days : radarRange === '30days' ? dimensions30Days : dimensionsAllTime)?.financial ?? 0, color: colors.dimFinancial },
            ].map((dim) => (
              <View key={dim.label} style={{ width: '48%', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dim.color, marginRight: 8 }} />
                <View>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{dim.label}</Text>
                  <Text style={{ color: dim.color, fontSize: 14, fontWeight: '800' }}>{dim.value}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Plain Language Summary Card */}
        {hasBaseline && (
          <View style={{
            marginHorizontal: 20, marginBottom: 24,
            backgroundColor: colors.surface, borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: colors.border,
          }}>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
              Your <Text style={{ color: colors.text, fontWeight: '700' }}>{strongestDim.name.toLowerCase()}</Text> wellness is your strongest area right now. Your <Text style={{ color: colors.text, fontWeight: '700' }}>{lowestDim.name.toLowerCase()}</Text> wellness could use some attention — check your Track page for a full breakdown.
            </Text>
          </View>
        )}

        {/* High Stress Alert Banner */}
        {showHighStressAlert && (
          <View style={{
            marginHorizontal: 20, marginBottom: 16,
            backgroundColor: '#FBBF2415', borderRadius: 18, padding: 20,
            borderWidth: 1, borderColor: '#FBBF2440',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="alert-circle" size={22} color="#FBBF24" style={{ marginRight: 10 }} />
              <Text style={{ color: '#FBBF24', fontWeight: '800', fontSize: 15 }}>
                High Stress Detected
              </Text>
            </View>
            <Text style={{ color: '#D4A81A', fontSize: 13, lineHeight: 20 }}>
              Your average stress over the past 7 days is{' '}
              <Text style={{ fontWeight: '800' }}>{avgStress}/10</Text>. That's quite high.
              Consider visiting the Campus Wellness Centre or scheduling a counselling appointment.
              Your wellbeing matters. 💛
            </Text>
            <TouchableOpacity style={{
              marginTop: 14, backgroundColor: '#FBBF2425', borderRadius: 12,
              paddingVertical: 12, alignItems: 'center',
              borderWidth: 1, borderColor: '#FBBF2440',
            }}>
              <Text style={{ color: '#FBBF24', fontWeight: '700' }}>View Campus Support</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Guest Chatbot FAB */}
      {isGuest && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: tabBarHeight + 20,
            right: 20,
            backgroundColor: colors.primary,
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 8,
          }}
          onPress={() => {
            Alert.alert(
              'Coming Soon! ✨',
              'Your personal wellness companion is on the way. Soon you\'ll have someone to talk to, anytime.',
              [{ text: 'Got it', style: 'default' }]
            );
          }}
        >
          <MaterialCommunityIcons name="robot-outline" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* New Report Modal Alert */}
      {newReportAlert && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(10, 15, 29, 0.8)',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          paddingHorizontal: 24
        }}>
          <View style={{
            backgroundColor: colors.surface, borderRadius: 24, padding: 32, width: '100%',
            borderWidth: 1, borderColor: colors.border, alignItems: 'center'
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary + '20',
              alignItems: 'center', justifyContent: 'center', marginBottom: 20
            }}>
              <Ionicons name="document-text" size={28} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>
              Your {newReportAlert.type} Wellness Report is ready.
            </Text>
            <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
              See how your {newReportAlert.type.toLowerCase() === 'weekly' ? 'week' : newReportAlert.type.toLowerCase() === 'monthly' ? 'month' : 'year'} looked and what we recommend going forward.
            </Text>
            
            <TouchableOpacity 
              onPress={() => {
                const reportId = newReportAlert.id;
                setNewReportAlert(null);
                navigation.navigate('ReportDetail', { reportId });
              }}
              style={{
                backgroundColor: colors.primary, width: '100%', paddingVertical: 16,
                borderRadius: 16, alignItems: 'center', marginBottom: 12
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>View Report</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setNewReportAlert(null)}
              style={{ width: '100%', paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: colors.muted, fontSize: 15, fontWeight: '600' }}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default DashboardScreen;
