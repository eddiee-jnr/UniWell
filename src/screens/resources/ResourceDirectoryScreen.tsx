import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const SERVICES = [
  {
    icon: 'alert-circle', title: 'Emergency Help', desc: 'Immediate assistance available for urgent situations.',
    color: '#F87171', bg: '#1C0F0F',
    actions: [
      { label: 'Crisis Hotline', icon: 'call', color: '#F87171', url: 'tel:+233302401681' },
      { label: 'Campus Security', icon: 'shield', color: '#F87171', url: 'tel:+233302401682' },
    ]
  },
  {
    icon: 'chatbubbles', title: 'Counseling Services',
    desc: 'Confidential one-on-one sessions to support your mental health and overall wellbeing.',
    color: '#7C6FEB', bg: '#111827',
    actions: [{ label: 'Schedule Appointment', icon: 'arrow-forward', color: '#7C6FEB', url: 'mailto:counseling@gimpa.edu.gh?subject=Counseling%20Appointment%20Request' }]
  },
  {
    icon: 'medical', title: 'Campus Health',
    desc: 'Full-service medical clinic for primary care, vaccinations, and wellness checks.',
    color: '#4ADE80', bg: '#0A1A12',
    badge: 'Open until 04:00 PM',
    actions: [{ label: 'Visit Clinic', icon: 'business', color: '#4ADE80', url: 'https://www.gimpa.edu.gh' }]
  },
];

import { useAuthStore } from '../../store/authStore';

export const ResourceDirectoryScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, theme } = useTheme();
  const { isGuest } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleAction = async (label: string, url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot perform action: ${label}. Deep link is unsupported on this device.`);
      }
    } catch (err) {
      console.error('Failed to open action URL:', err);
      Alert.alert('Error', 'Failed to open link.');
    }
  };

  const filteredServices = SERVICES.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {filteredServices.length === 0 ? (
        <View style={{
          marginHorizontal: 20, padding: 32, 
          backgroundColor: colors.surface, borderRadius: 20,
          borderWidth: 1, borderColor: colors.border, alignItems: 'center'
        }}>
          <Text style={{ color: colors.muted, fontSize: 14 }}>No matching support services found.</Text>
        </View>
      ) : (
        filteredServices.map((s) => (
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
              {s.badge && (
                <View style={{ backgroundColor: s.color + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: s.color, fontSize: 10, fontWeight: '800' }}>{s.badge}</Text>
                </View>
              )}
            </View>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>{s.desc}</Text>
            {s.actions?.filter(a => !(isGuest && a.label === 'Visit Clinic')).map(a => (
              <TouchableOpacity 
                key={a.label} 
                onPress={() => handleAction(a.label, a.url)}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: s.color + '15', borderRadius: 12,
                  paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
                  borderWidth: 1, borderColor: s.color + '30'
                }}
              >
                {a.icon ? <Ionicons name={a.icon as any} size={16} color={a.color} style={{ marginRight: 8 }} /> : null}
                <Text style={{ color: a.color, fontWeight: '700', fontSize: 14 }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default ResourceDirectoryScreen;
