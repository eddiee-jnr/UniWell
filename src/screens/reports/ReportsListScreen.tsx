import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLocalReports, WellnessReport } from '../../services/storage';
import { useAuthStore } from '../../store/authStore';

type Tab = 'weekly' | 'monthly' | 'yearly';

export const ReportsListScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { session, isGuest } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('weekly');
  const [reports, setReports] = useState<WellnessReport[]>([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect ensures reports are re-fetched every time the user navigates
  // to this screen, including after rehydration has completed.
  useFocusEffect(
    useCallback(() => {
      const fetchReports = async () => {
        setLoading(true);
        const userId = session?.user.id || 'guest';
        const allReports = await getLocalReports(userId);
        setReports(allReports);
        setLoading(false);
      };
      
      if (!isGuest) fetchReports();
      else setLoading(false);
    }, [session, isGuest])
  );


  const filteredReports = reports.filter(r => r.type === activeTab);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Wellness Reports</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {(['weekly', 'monthly', 'yearly'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8,
              backgroundColor: activeTab === tab ? colors.primary : 'transparent'
            }}
          >
            <Text style={{ 
              fontWeight: '700', fontSize: 14, 
              color: activeTab === tab ? '#fff' : colors.muted 
            }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {isGuest ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="lock-closed-outline" size={48} color={colors.muted} />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 16 }}>Sign in required</Text>
            <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 8 }}>Create an account to track your wellness history and generate reports.</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredReports.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40, backgroundColor: colors.surface, padding: 32, borderRadius: 16 }}>
            <Ionicons name="document-text-outline" size={48} color={colors.muted} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
              Your reports will appear here as you use the app. Keep checking in daily to generate your first {activeTab} report.
            </Text>
          </View>
        ) : (
          filteredReports.map((report) => (
            <TouchableOpacity
              key={report.id}
              onPress={() => navigation.navigate('ReportDetail', { reportId: report.id, report })}
              style={{
                backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16,
                borderWidth: 1, borderColor: colors.border
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>{report.date_label}</Text>
                <View style={{ backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Score: {report.overall_score}%</Text>
                </View>
              </View>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{report.summary}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};
