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

  const getMoodEmojiAndLabel = (score: number) => {
    if (score >= 4.5) return '😁 Great';
    if (score >= 3.5) return '🙂 Good';
    if (score >= 2.5) return '😐 Neutral';
    if (score >= 1.5) return '🙁 Down';
    return '😢 Bad';
  };

  const getStressLabel = (score: number) => {
    if (score >= 7.5) return '😫 High';
    if (score >= 4.5) return '😐 Moderate';
    return '😌 Low';
  };

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

        {/* Core Averages Row Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="trending-up" size={20} color={colors.secondary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📈 Core Averages
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* Avg Mood Card */}
            <View style={{ width: '23%', backgroundColor: colors.surface, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }} numberOfLines={1}>Avg Mood</Text>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 4 }}>{content.mood_average !== undefined ? `${content.mood_average}/5` : 'N/A'}</Text>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>
                {content.mood_average !== undefined ? getMoodEmojiAndLabel(content.mood_average) : ''}
              </Text>
            </View>

            {/* Avg Stress Card */}
            <View style={{ width: '23%', backgroundColor: colors.surface, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }} numberOfLines={1}>Avg Stress</Text>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 4 }}>{content.stress_average !== undefined ? `${content.stress_average}/10` : 'N/A'}</Text>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>
                {content.stress_average !== undefined ? getStressLabel(content.stress_average) : ''}
              </Text>
            </View>

            {/* Strongest Card */}
            <View style={{ width: '23%', backgroundColor: colors.surface, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }} numberOfLines={1}>Strongest</Text>
              <Text style={{ color: '#4ADE80', fontSize: 10, fontWeight: '800', marginBottom: 4, textAlign: 'center' }} numberOfLines={1}>
                {content.highest_dimension || 'N/A'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>
                ⭐️ {highestScore !== null ? `${highestScore}%` : ''}
              </Text>
            </View>

            {/* Focus Area Card */}
            <View style={{ width: '23%', backgroundColor: colors.surface, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }} numberOfLines={1}>Focus Area</Text>
              <Text style={{ color: '#F87171', fontSize: 10, fontWeight: '800', marginBottom: 4, textAlign: 'center' }} numberOfLines={1}>
                {content.lowest_dimension || 'N/A'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>
                ⚠️ {lowestScore !== null ? `${lowestScore}%` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Behavior & Activity List Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="stats-chart" size={20} color={colors.secondary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📊 Behavior & Activity
            </Text>
          </View>
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Exercises Completed</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                {content.completed_exercises_count ?? 0} {content.exercises_duration_mins ? `(${content.exercises_duration_mins} mins)` : '(0 mins)'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Wellness Tips Read</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                {content.tips_read_count ?? 0}
              </Text>
            </View>

            {content.tasks_total_count !== undefined && content.tasks_total_count > 0 && (
              <>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Academic Tasks Completed</Text>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                    {content.tasks_completed_count ?? 0} / {content.tasks_total_count} ({Math.round(((content.tasks_completed_count ?? 0) / content.tasks_total_count) * 100)}%)
                  </Text>
                </View>
              </>
            )}

            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>Check-in Streak</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                {content.active_streak ?? 0} day(s)
              </Text>
            </View>
          </View>
        </View>

        {/* Month-on-Month Comparison Section */}
        {content.comparison && Object.keys(content.comparison).length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="trending-up" size={20} color={colors.secondary} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📈 Month-on-Month Comparison
              </Text>
            </View>
            <View style={{ gap: 14 }}>
              {Object.entries(content.comparison).map(([dimKey, data]: [string, any], idx: number) => {
                const current = data.current;
                const previous = data.previous;
                const diff = current - previous;
                
                let arrow = '→';
                let arrowColor = colors.muted;
                if (diff > 0) {
                  arrow = '↑';
                  arrowColor = '#4ADE80';
                } else if (diff < 0) {
                  arrow = '↓';
                  arrowColor = '#F87171';
                }
                
                const formattedName = dimKey.charAt(0).toUpperCase() + dimKey.slice(1);
                
                return (
                  <View key={dimKey}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>{formattedName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginRight: 8 }}>{current}%</Text>
                        <Text style={{ color: arrowColor, fontSize: 16, fontWeight: '900', marginRight: 8 }}>{arrow}</Text>
                        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '500' }}>(was {previous}%)</Text>
                      </View>
                    </View>
                    {idx < Object.keys(content.comparison).length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.border, marginTop: 14 }} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

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
