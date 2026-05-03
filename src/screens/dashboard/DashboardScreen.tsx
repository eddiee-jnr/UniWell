import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useWellnessScore } from '../../hooks/useWellnessScore';
import { MoodLineChart } from '../../components/charts/MoodLineChart';
import { StressHeatmap } from '../../components/charts/StressHeatmap';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';

interface StatCardProps {
  icon: string;
  iconLib: 'Ionicons' | 'Material';
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconLib, label, value, color }) => {
  const { colors } = useTheme();
  return (
    <View style={{
      flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginHorizontal: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    }}>
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
    </View>
  );
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { userProfile, isGuest } = useAuthStore();
  const { last7Days, avgStress, tipsReadCount, streakCount, dimensions, loading, error } = useWellnessScore();
  const tabBarHeight = useBottomTabBarHeight();

  const showHighStressAlert = avgStress >= 7 && last7Days.length > 0;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 16, fontSize: 14 }}>Loading your wellness data...</Text>
      </View>
    );
  }

  return (
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
            <MaterialCommunityIcons name="brain" size={18} color="#fff" />
          </View>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>UniWell</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </TouchableOpacity>
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

      {/* Error Banner */}
      {error && (
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

      {/* Stat Cards */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 24 }}>
        <StatCard
          icon="flame"
          iconLib="Ionicons"
          label="DAY STREAK"
          value={streakCount}
          color="#FBBF24"
        />
        <StatCard
          icon="dumbbell"
          iconLib="Material"
          label="EXERCISES"
          value="—"
          color="#38BDF8"
        />
        <StatCard
          icon="book-outline"
          iconLib="Ionicons"
          label="TIPS READ"
          value={tipsReadCount}
          color="#4ADE80"
        />
      </View>

      {/* Mood Line Chart */}
      <View style={{
        marginHorizontal: 20, marginBottom: 24,
        backgroundColor: colors.surface, borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: colors.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="trending-up" size={18} color={colors.secondary} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
            Mood — Last 7 Days
          </Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16 }}>
          Scale: 1 (Low) → 5 (Great)
        </Text>
        <MoodLineChart entries={last7Days} />
      </View>

      {/* Stress Heatmap */}
      <View style={{
        marginHorizontal: 20, marginBottom: 24,
        backgroundColor: colors.surface, borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: colors.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="grid" size={18} color="#F472B6" style={{ marginRight: 8 }} />
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
            Stress Heatmap — 4 Weeks
          </Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16 }}>
          Color intensity reflects daily stress level
        </Text>
        <StressHeatmap entries={last7Days} />
      </View>

      {/* Assessment Call to Action */}
      {dimensions.mental === 0 && (
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
              Set Your Baseline
            </Text>
          </View>
          <Text style={{ color: colors.secondary, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
            Your wellness metrics are empty. Take our 2-minute baseline test to calibrate your personal sanctuary.
          </Text>
          <TouchableOpacity 
            onPress={() => (navigation as any).navigate('WellnessAssessment')}
            style={{
              backgroundColor: colors.primary, borderRadius: 12,
              paddingVertical: 14, alignItems: 'center',
            }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Start Assessment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dimensions of Wellness */}
      <View style={{
        marginHorizontal: 20, marginBottom: 24,
        backgroundColor: colors.surface, borderRadius: 20, padding: 24,
        borderWidth: 1, borderColor: colors.border,
      }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>
          Dimensions of Wellness
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 20 }}>
          {dimensions.mental === 0 
            ? 'Take the assessment to unlock these health pillars' 
            : 'Your balance across key health pillars'}
        </Text>

        {[
          { label: 'Mental', value: dimensions?.mental ?? 0, color: colors.secondary },
          { label: 'Physical', value: dimensions?.physical ?? 0, color: colors.accent },
          { label: 'Academic', value: dimensions?.academic ?? 0, color: '#FBBF24' },
          { label: 'Social', value: dimensions?.social ?? 0, color: '#4ADE80' },
        ].map((dim) => (
          <View key={dim.label} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{dim.label}</Text>
              <Text style={{ color: dim.color, fontSize: 13, fontWeight: '800' }}>{dim.value}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
              <View style={{ 
                height: 8, 
                width: `${dim.value}%`, 
                backgroundColor: dim.color, 
                borderRadius: 4,
                shadowColor: dim.color,
                shadowOpacity: 0.5,
                shadowRadius: 4,
              }} />
            </View>
          </View>
        ))}
      </View>

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
  );
};

export default DashboardScreen;
