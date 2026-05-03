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
    desc: 'Confidential one-on-one sessions to support your mental health and overall wellbeing. Available in person or via telehealth.',
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
  {
    icon: 'wallet', title: 'Financial Wellness',
    desc: 'Budgeting coaching, emergency grants, and financial literacy resources.',
    color: '#FBBF24', bg: '#111827',
    chips: ['GRANTS', 'COACHING']
  },
  {
    icon: 'school', title: 'Development Workshops',
    desc: 'Academic coaching, leadership training, and personal growth seminars.',
    color: '#38BDF8', bg: '#111827',
    badgeText: 'Seminar this Friday'
  },
];

const additional = [
  { icon: 'people', title: 'Peer Mentorship', desc: 'Student-led mentorship programme', arrow: true },
  { icon: 'accessibility', title: 'Learning Accommodations', desc: 'Disability services and specialised support', arrow: true },
  { icon: 'restaurant', title: 'Campus Food Pantry', desc: 'Confidential nutritional support for students', arrow: true },
];

export const SupportScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, theme } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10
            }}>
              <MaterialCommunityIcons name="brain" size={18} color="#fff" />
            </View>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>UniWell</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 6 }}>Campus Support</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 18, lineHeight: 20 }}>
          Resources and dedicated professionals available to ensure your wellness journey is fully supported.
        </Text>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.surface, borderRadius: 14,
          borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
        }}>
          <Ionicons name="search-outline" size={18} color={colors.muted} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Search support services, clinics..."
            placeholderTextColor={colors.muted}
            style={{ color: colors.text, flex: 1, fontSize: 14 }}
          />
        </View>
      </View>

      {/* Service Cards */}
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
          {s.badge && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.color, marginRight: 6 }} />
              <Text style={{ color: s.color, fontSize: 12, fontWeight: '600' }}>{s.badge}</Text>
            </View>
          )}
          {s.chips && (
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {s.chips.map(c => (
                <View key={c} style={{
                  backgroundColor: colors.border, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 4, marginRight: 8,
                }}>
                  <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>{c}</Text>
                </View>
              ))}
            </View>
          )}
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

      {/* Additional Support */}
      <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 12 }}>
          ADDITIONAL RESOURCES
        </Text>
        {additional.map((a) => (
          <TouchableOpacity key={a.title} style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
            borderWidth: 1, borderColor: colors.border,
          }}>
            <View style={{
              width: 38, height: 38, borderRadius: 10, backgroundColor: colors.background,
              alignItems: 'center', justifyContent: 'center', marginRight: 14,
            }}>
              <Ionicons name={a.icon as any} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 2 }}>{a.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{a.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default SupportScreen;
