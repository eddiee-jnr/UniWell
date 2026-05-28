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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{report.date_label}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        
        {/* Radar Chart Snapshot */}
        {content.dimensions && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>Snapshot</Text>
            <RadarChart dimensions={content.dimensions} size={280} />
          </View>
        )}

        {/* Metrics Summary */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          {content.mood_average !== undefined && (
            <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Avg Mood</Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{content.mood_average}/10</Text>
            </View>
          )}
          {content.stress_average !== undefined && (
            <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Avg Stress</Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{content.stress_average}/10</Text>
            </View>
          )}
          {content.highest_dimension !== undefined && (
            <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Strongest</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{content.highest_dimension}</Text>
            </View>
          )}
          {content.lowest_dimension !== undefined && (
            <View style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Focus Area</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{content.lowest_dimension}</Text>
            </View>
          )}
        </View>

        {/* Summary Text */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Summary</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24 }}>{report.summary}</Text>
        </View>

        {/* Dynamic Recommendation/Support Message */}
        {(content.recommendation || content.support_message || content.reflection_message) && (
          <View style={{ backgroundColor: colors.primary + '10', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.primary + '30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="bulb" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Recommendation</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24 }}>
              {content.recommendation || content.support_message || content.reflection_message}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
