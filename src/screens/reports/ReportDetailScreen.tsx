import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { WellnessReport } from '../../services/storage';
import { RadarChart } from '../../components/charts/RadarChart';

export const ReportDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const report = route.params?.report as WellnessReport;

  if (!report) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Report not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const content = JSON.parse(report.content_json);

  const highestScore = content.highest_dimension && content.dimensions 
    ? content.dimensions[content.highest_dimension.toLowerCase()] 
    : null;
  const lowestScore = content.lowest_dimension && content.dimensions 
    ? content.dimensions[content.lowest_dimension.toLowerCase()] 
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navigation Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
          Back to Reports
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        
        {/* Overall Report Header Card */}
        <View style={{ 
          backgroundColor: colors.primary, 
          borderRadius: 20, 
          padding: 24, 
          marginBottom: 24, 
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.8, marginBottom: 8 }}>
            📄 {report.type.toUpperCase()} REPORT
          </Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 }}>
            {report.date_label}
          </Text>
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 12 }} />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
            Overall Wellness Score: <Text style={{ fontSize: 24, fontWeight: '900' }}>{report.overall_score}%</Text>
          </Text>
        </View>

        {/* Radar Snapshot Section */}
        {content.dimensions && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16 }}>
              <Ionicons name="compass" size={20} color={colors.secondary} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🧭 Radar Snapshot
              </Text>
            </View>
            <RadarChart dimensions={content.dimensions} size={280} />
          </View>
        )}

        {/* Core Metrics Table Section */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="stats-chart" size={20} color={colors.secondary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📊 Core Metrics
            </Text>
          </View>
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Average Mood</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                {content.mood_average !== undefined ? `${content.mood_average} / 5` : 'N/A'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Average Stress</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                {content.stress_average !== undefined ? `${content.stress_average} / 10` : 'N/A'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Strongest Area</Text>
              <Text style={{ color: '#4ADE80', fontSize: 14, fontWeight: '800' }}>
                {content.highest_dimension ? `${content.highest_dimension} (${highestScore ?? 0}%)` : 'N/A'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Focus Area</Text>
              <Text style={{ color: '#F87171', fontSize: 14, fontWeight: '800' }}>
                {content.lowest_dimension ? `${content.lowest_dimension} (${lowestScore ?? 0}%)` : 'N/A'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Exercises Done</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                {content.completed_exercises_count ?? 0} {content.exercises_duration_mins ? `(${content.exercises_duration_mins} mins)` : ''}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Tips Read</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                {content.tips_read_count ?? 0}
              </Text>
            </View>

            {content.tasks_total_count !== undefined && content.tasks_total_count > 0 && (
              <>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Academic Tasks Done</Text>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                    {content.tasks_completed_count ?? 0} / {content.tasks_total_count} ({Math.round(((content.tasks_completed_count ?? 0) / content.tasks_total_count) * 100)}%)
                  </Text>
                </View>
              </>
            )}

            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Log Streak</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                {content.active_streak ?? 0} day(s)
              </Text>
            </View>
          </View>
        </View>

        {/* Written Analysis Section */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="document-text" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📝 Written Analysis
            </Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontStyle: 'italic' }}>
            "{report.summary}"
          </Text>
        </View>

        {/* Positive Trends Section */}
        {content.trends && content.trends.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="trending-up" size={20} color="#4ADE80" style={{ marginRight: 8 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📈 Positive Trends
              </Text>
            </View>
            {content.trends.map((trend: string, idx: number) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 }}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#4ADE80" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 }}>{trend}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Worries / Alerts Section */}
        {content.worries && content.worries.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="alert-circle" size={20} color="#F87171" style={{ marginRight: 8 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚠️ Worries & Alerts
              </Text>
            </View>
            {content.worries.map((worry: string, idx: number) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 }}>
                <Ionicons name="warning-outline" size={16} color="#F87171" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 }}>{worry}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendation Section */}
        {(content.recommendation || content.support_message || content.reflection_message) && (
          <View style={{ backgroundColor: colors.primary + '15', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.primary + '30', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="bulb" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                💡 Recommendation
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: '500' }}>
              "{content.recommendation || content.support_message || content.reflection_message}"
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
