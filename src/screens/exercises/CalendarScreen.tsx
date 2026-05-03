import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const calendarRows = [
  [24, 25, 26, 27, 28, 29, 1],
  [2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20, 21, 22],
];
const tasks = [
  { title: 'Advanced Thermodynamics Revision', sub: 'Chapter 4 & 5 Practice Problems', tag: 'ACADEMIC', tagColor: '#38BDF8', done: false, priority: false },
  { title: 'Submit Research Proposal', sub: 'Draft sent to Prof. Henderson', tag: 'DONE', tagColor: '#4ADE80', done: true, priority: false },
  { title: 'Statistical Analysis Lab Report', sub: 'Due at 11:59 PM', tag: 'PRIORITY', tagColor: '#F87171', done: false, priority: true },
];

export const CalendarScreen = () => {
  const [selected, setSelected] = useState(10);
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, theme } = useTheme();

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Academic Flow</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Add Reminder</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>October 2023</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity><Ionicons name="chevron-back" size={20} color={colors.muted} /></TouchableOpacity>
            <TouchableOpacity><Ionicons name="chevron-forward" size={20} color={colors.muted} /></TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          {DAYS.map(d => <Text key={d} style={{ flex: 1, textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '700' }}>{d}</Text>)}
        </View>
        {calendarRows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', marginBottom: 8 }}>
            {row.map((day, di) => {
              const isSel = day === selected && ri > 0;
              const isGreen = day === 20 && ri === 3;
              return (
                <TouchableOpacity key={di} onPress={() => setSelected(day)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 36, backgroundColor: isSel ? colors.primary : isGreen ? '#4ADE80' : 'transparent', borderRadius: 18 }}>
                  <Text style={{ color: isSel || isGreen ? '#fff' : ri === 0 ? colors.muted : colors.text, fontWeight: isSel ? '800' : '400', fontSize: 14 }}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
        <View style={{ height: 130, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <MaterialCommunityIcons name="meditation" size={60} color={colors.primary} />
        </View>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ backgroundColor: '#4ADE8022', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10 }}>
              <Text style={{ color: '#4ADE80', fontSize: 11, fontWeight: '700' }}>PROACTIVE FLOW</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Ionicons name="time-outline" size={14} color={colors.muted} style={{ marginRight: 4 }} />
               <Text style={{ color: colors.muted, fontSize: 12 }}>5mins</Text>
            </View>
          </View>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>Finals Prep: Box Breathing</Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 18 }}>Your finals are approaching in 14 days. Ground your nervous system before the deep study block.</Text>
          <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Begin Session</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Today's Tasks</Text>
          <Text style={{ color: '#4ADE80', fontWeight: '700' }}>2/4 Done</Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16 }}>Focus on high-impact objectives</Text>
        {tasks.map((t, i) => (
          <View key={i} style={{ 
            flexDirection: 'row', alignItems: 'flex-start', 
            backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10, 
            borderWidth: 1, borderColor: t.priority ? '#F8717144' : colors.border,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1,
          }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: t.done ? '#4ADE80' : t.priority ? '#F87171' : colors.border, backgroundColor: t.done ? '#4ADE8022' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 }}>
              {t.done && <Ionicons name="checkmark" size={14} color="#4ADE80" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.done ? colors.muted : colors.text, fontWeight: '700', marginBottom: 2 }}>{t.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{t.sub}</Text>
            </View>
            <View style={{ backgroundColor: t.tagColor + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 }}>
              <Text style={{ color: t.tagColor, fontSize: 10, fontWeight: '800' }}>{t.tag}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default CalendarScreen;
