import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const dimensions = [
  { label: 'Emotional',     icon: 'heart',              lib: 'Ionicons',            value: 82, color: '#A78BFA' },
  { label: 'Physical',      icon: 'fitness',            lib: 'Ionicons',            value: 65, color: '#4ADE80' },
  { label: 'Social',        icon: 'people',             lib: 'Ionicons',            value: 91, color: '#38BDF8' },
  { label: 'Occupational',  icon: 'briefcase',          lib: 'Ionicons',            value: 45, color: '#FBBF24' },
  { label: 'Intellectual',  icon: 'book',               lib: 'Ionicons',            value: 77, color: '#7C6FEB' },
  { label: 'Spiritual',     icon: 'sparkles',           lib: 'Ionicons',            value: 58, color: '#F472B6' },
  { label: 'Environmental', icon: 'leaf',               lib: 'Ionicons',            value: 89, color: '#34D399' },
  { label: 'Financial',     icon: 'account-balance',    lib: 'MaterialIcons',       value: 72, color: '#FB923C' },
];

const upcomingRituals = [
  { icon: 'weather-night',  title: 'Evening Breathwork',    time: '20:00 • 15 mins' },
  { icon: 'tree',           title: 'Nature Immersion',      time: 'Tomorrow, 07:30' },
];

const IconComponent = ({ item, color }: { item: any, color: string }) => {
  if (item.lib === 'Ionicons') return <Ionicons name={item.icon} size={20} color={color} />;
  return <MaterialCommunityIcons name={item.icon} size={20} color={color} />;
};

export const HomeScreen = () => {
  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#7C6FEB', alignItems: 'center', justifyContent: 'center', marginRight: 10
          }}>
             <MaterialCommunityIcons name="brain" size={18} color="#fff" />
          </View>
          <Text style={{ color: '#F0F4FF', fontSize: 18, fontWeight: '700' }}>UniWell</Text>
        </View>
        <TouchableOpacity style={{
          backgroundColor: '#7C6FEB', borderRadius: 20,
          paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center',
        }}>
          <Ionicons name="add-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Track Mood</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ color: '#F0F4FF', fontSize: 26, fontWeight: '800', marginBottom: 4 }}>
          Dimensions of{'\n'}Wellness
        </Text>
        <Text style={{ color: '#6B7A99', fontSize: 13 }}>
          A holistic view of your current equilibrium.
        </Text>
      </View>

      {/* Dimension Cards */}
      {dimensions.map((dim) => (
        <View key={dim.label} style={{
          marginHorizontal: 20, marginBottom: 14,
          backgroundColor: '#111827', borderRadius: 16, padding: 18,
          borderWidth: 1, borderColor: '#1F2D45',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: dim.color + '15',
              alignItems: 'center', justifyContent: 'center', marginRight: 10,
            }}>
              <IconComponent item={dim} color={dim.color} />
            </View>
            <Text style={{ color: '#F0F4FF', fontWeight: '700', flex: 1 }}>{dim.label}</Text>
            <Text style={{ color: dim.color, fontWeight: '800', fontSize: 18 }}>{dim.value}%</Text>
          </View>
          {/* Progress bar */}
          <View style={{ height: 5, backgroundColor: '#1F2D45', borderRadius: 99 }}>
            <View style={{
              height: 5, width: `${dim.value}%`, borderRadius: 99,
              backgroundColor: dim.color,
            }} />
          </View>
        </View>
      ))}

      {/* Weekly Equilibrium Card */}
      <View style={{
        marginHorizontal: 20, marginTop: 8, marginBottom: 20,
        backgroundColor: '#111827', borderRadius: 20, padding: 22,
        borderWidth: 1, borderColor: '#1F2D45',
      }}>
        <Text style={{ color: '#6B7A99', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>
          REFLECT & RESTORE
        </Text>
        <Text style={{ color: '#F0F4FF', fontSize: 22, fontWeight: '800', marginBottom: 10 }}>
          Weekly Equilibrium{'\n'}Report
        </Text>
        <Text style={{ color: '#6B7A99', fontSize: 13, lineHeight: 20 }}>
          Your spiritual and social metrics have increased by 14% since Monday. Consider focusing on physical recovery this evening.
        </Text>
      </View>

      {/* Upcoming Rituals */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ color: '#F0F4FF', fontWeight: '700', fontSize: 16, marginBottom: 14 }}>
          Upcoming Rituals
        </Text>
        {upcomingRituals.map((r) => (
          <View key={r.title} style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#111827', borderRadius: 14, padding: 16,
            marginBottom: 10, borderWidth: 1, borderColor: '#1F2D45',
          }}>
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: '#1C2742', alignItems: 'center', justifyContent: 'center',
              marginRight: 14,
            }}>
              <MaterialCommunityIcons name={r.icon as any} size={20} color="#7C6FEB" />
            </View>
            <View>
              <Text style={{ color: '#F0F4FF', fontWeight: '700', marginBottom: 2 }}>{r.title}</Text>
              <Text style={{ color: '#6B7A99', fontSize: 12 }}>{r.time}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={{
          backgroundColor: '#1C2742', borderRadius: 14, paddingVertical: 14,
          alignItems: 'center', marginTop: 4,
        }}>
          <Text style={{ color: '#A78BFA', fontWeight: '700' }}>View Schedule</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
