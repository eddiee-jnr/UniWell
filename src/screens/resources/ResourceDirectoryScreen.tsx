import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const services = [
  {
    icon: 'alert-circle', title: 'Emergency Help', desc: 'Immediate assistance available for urgent situations.',
    color: '#F87171', bg: '#1C0F0F',
    actions: [
      { label: 'Crisis Hotline', icon: 'call', color: '#F87171' },
      { label: 'Campus Security', icon: 'shield', color: '#F87171' },
    ]
  },
  {
    icon: 'chatbubbles', title: 'Counseling Services',
    desc: 'Confidential one-on-one sessions to support your mental health and overall wellbeing.',
    color: '#7C6FEB', bg: '#111827',
    actions: [{ label: 'Schedule Appointment', icon: 'arrow-forward', color: '#7C6FEB' }]
  },
  {
    icon: 'medical', title: 'Campus Health',
    desc: 'Full-service medical clinic for primary care, vaccinations, and wellness checks.',
    color: '#4ADE80', bg: '#0A1A12',
    badge: 'Open until 02:00 PM',
    actions: [{ label: 'Visit Clinic', icon: 'business', color: '#4ADE80' }]
  },
];

export const ResourceDirectoryScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, theme } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 6 }}>Campus Support</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 18, lineHeight: 20 }}>
          Resources and dedicated professionals available to ensure your wellness journey is fully supported.
        </Text>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.surface, borderRadius: 14,
          borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
        }}>
          <Ionicons name="search-outline" size={18} color={colors.muted} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Search support services..."
            placeholderTextColor={colors.muted}
            style={{ color: colors.text, flex: 1, fontSize: 14 }}
          />
        </View>
      </View>

      {services.map((s) => (
        <View key={s.title} style={{
          marginHorizontal: 20, marginBottom: 14,
          backgroundColor: theme === 'dark' ? s.bg : colors.surface, 
          borderRadius: 20, padding: 20,
          borderWidth: 1, borderColor: colors.border,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name={s.icon as any} size={24} color={s.color} style={{ marginRight: 12 }} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, flex: 1 }}>{s.title}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>{s.desc}</Text>
          {s.actions?.map(a => (
            <TouchableOpacity key={a.label} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              backgroundColor: s.color + '15', borderRadius: 12,
              paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
              borderWidth: 1, borderColor: s.color + '30'
            }}>
              {a.icon ? <Ionicons name={a.icon as any} size={16} color={a.color} style={{ marginRight: 8 }} /> : null}
              <Text style={{ color: a.color, fontWeight: '700', fontSize: 14 }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

export default ResourceDirectoryScreen;
