import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  Modal, TextInput, StyleSheet, ActivityIndicator, Alert 
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useAcademicStore } from '../../store/academicStore';
import { getLocalCalendarEvents, CalendarEvent } from '../../services/storage';
import exercisesData from '../../data/exercises.json';
import { useNavigation } from '@react-navigation/native';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const LEGEND_ITEMS = [
  { label: 'Exam', color: '#EF4444' },
  { label: 'Deadline', color: '#F59E0B' },
  { label: 'Holiday', color: '#10B981' },
  { label: 'Event', color: '#3B82F6' },
  { label: 'Registration', color: '#8B5CF6' },
  { label: 'Personal', color: '#EC4899' },
];

export const CalendarScreen = () => {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const { colors, theme } = useTheme();
  const { session } = useAuthStore();
  const userId = session?.user.id || 'guest';

  // Store actions and state
  const { tasks, loading, loadTasks, addTask, toggleTask, deleteTask } = useAcademicStore();

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  
  // GIMPA Calendar Events State
  const [academicEvents, setAcademicEvents] = useState<CalendarEvent[]>([]);

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSub, setTaskSub] = useState('');
  const [taskTag, setTaskTag] = useState<'ACADEMIC' | 'PRIORITY' | 'DONE'>('ACADEMIC');
  const [taskAlert, setTaskAlert] = useState<'none' | '1h' | '2h' | '1d' | '2d' | '7d'>('none');

  const fetchEvents = async () => {
    const events = await getLocalCalendarEvents(userId);
    setAcademicEvents(events);
  };

  useEffect(() => {
    loadTasks();
    fetchEvents();
  }, [userId]);

  // Generate Month Grid Rows dynamically
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const gridCells: { day: number; isCurrentMonth: boolean; dateString: string }[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, prevDay);
    gridCells.push({
      day: prevDay,
      isCurrentMonth: false,
      dateString: prevMonthDate.toISOString().split('T')[0]
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const currDate = new Date(year, month, i);
    gridCells.push({
      day: i,
      isCurrentMonth: true,
      dateString: currDate.toISOString().split('T')[0]
    });
  }

  const targetCells = gridCells.length <= 35 ? 35 : 42;
  const nextMonthCells = targetCells - gridCells.length;
  for (let i = 1; i <= nextMonthCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    gridCells.push({
      day: i,
      isCurrentMonth: false,
      dateString: nextMonthDate.toISOString().split('T')[0]
    });
  }

  const calendarRows = [];
  for (let i = 0; i < gridCells.length; i += 7) {
    calendarRows.push(gridCells.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDate = (dateStr: string) => {
    // Combine academic calendar events and personal reminders/tasks matching the date
    const localCal = academicEvents.filter(e => dateStr >= e.date && dateStr <= e.endDate);
    const personalTasks = tasks.filter(t => t.date === dateStr).map(t => ({
      id: t.id,
      user_id: t.user_id,
      title: t.title,
      date: t.date,
      endDate: t.date,
      type: 'personal',
      description: t.sub || 'Personal reminder',
      institution: 'gimpa',
      priority: t.priority ? 'high' as const : 'low' as const,
      synced: t.synced
    }));
    return [...localCal, ...personalTasks];
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'exam': return '#EF4444'; // Red
      case 'deadline': return '#F59E0B'; // Amber
      case 'holiday': return '#10B981'; // Green
      case 'event': return '#3B82F6'; // Blue
      case 'registration': return '#8B5CF6'; // Purple
      case 'personal': return '#EC4899'; // Pink
      default: return colors.primary;
    }
  };

  // Helper to calculate countdown for exams/deadlines
  const getCountdownText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr + 'T00:00:00');
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0 || diffDays > 14) return null;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days away`;
  };

  const activeEvents = getEventsForDate(selectedDateStr);
  
  // Nudge logic: count high-priority events in the selected date's calendar week
  const isHeavyWeek = (dateStr: string) => {
    const selected = new Date(dateStr);
    
    const dayOfWeek = (selected.getDay() + 6) % 7; // Monday is 0
    const startOfWeek = new Date(selected);
    startOfWeek.setDate(selected.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Combine GIMPA events and personal tasks
    const allCalAndTasks = [
      ...academicEvents,
      ...tasks.map(t => ({ date: t.date, priority: t.priority ? 'high' : 'low' }))
    ];

    const highPriorityCount = allCalAndTasks.filter(e => {
      const eDate = new Date(e.date + 'T00:00:00');
      return e.priority === 'high' && eDate >= startOfWeek && eDate <= endOfWeek;
    }).length;

    return highPriorityCount >= 3;
  };

  // Get next 3 upcoming events from today
  const getUpcomingEvents = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const personalMapped = tasks.map(t => ({
      id: t.id,
      user_id: t.user_id,
      title: t.title,
      date: t.date,
      endDate: t.date,
      type: 'personal',
      description: t.sub || '',
      institution: 'gimpa',
      priority: t.priority ? 'high' as const : 'low' as const,
      synced: t.synced
    }));

    return [...academicEvents, ...personalMapped]
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  };

  const upcomingEvents = getUpcomingEvents();

  const handleAddTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      await addTask({
        title: taskTitle,
        sub: taskSub,
        tag: taskTag === 'DONE' ? 'ACADEMIC' : taskTag,
        date: selectedDateStr,
        priority: taskTag === 'PRIORITY',
        alert_trigger: taskAlert
      });

      if (taskAlert === 'none') {
        Alert.alert('Success', 'Task added successfully.');
      } else {
        Alert.alert('Success', 'Task added! Reminder scheduled.');
      }

      // Reset fields
      setTaskTitle('');
      setTaskSub('');
      setTaskTag('ACADEMIC');
      setTaskAlert('none');
      setModalVisible(false);
      
      // Reload events in local state
      fetchEvents();
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  // Begin proactive Box Breathing session
  const handleBeginBreathing = () => {
    const boxBreathing = exercisesData.find(ex => ex.title === 'Box Breathing') || exercisesData[0];
    navigation.getParent()?.navigate('ExercisePlayer', { exercise: boxBreathing });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>Academic Flow</Text>
          <View style={{ backgroundColor: colors.primary + '22', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>GIMPA 2025/26</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 16 }}>
          {LEGEND_ITEMS.map(item => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 6 }} />
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '700' }}>{item.label}</Text>
            </View>
          ))}
        </View>
        
        {/* Add Reminder CTA */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            style={{ backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
          >
            <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Add Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid Card */}
        <View style={{ marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 20 }}>
          {/* Calendar Header controls with Today Button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{MONTHS[month]} {year}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity 
                onPress={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  setSelectedDateStr(today.toISOString().split('T')[0]);
                }}
                style={{ 
                  backgroundColor: colors.primary + '20', 
                  paddingHorizontal: 12, 
                  paddingVertical: 6, 
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.primary + '40'
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePrevMonth}>
                <Ionicons name="chevron-back" size={20} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextMonth}>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday headers */}
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            {DAYS.map(d => (
              <Text key={d} style={{ flex: 1, textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '700' }}>{d}</Text>
            ))}
          </View>

          {/* Day Grid Rows */}
          {calendarRows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', marginBottom: 8 }}>
              {row.map((cell, di) => {
                const isSelected = cell.dateString === selectedDateStr;
                const todayStr = new Date().toISOString().split('T')[0];
                const isToday = cell.dateString === todayStr;
                
                const dateEvents = getEventsForDate(cell.dateString);
                
                let dayBg = 'transparent';
                let textColor = cell.isCurrentMonth ? colors.text : colors.muted;
                let fontWeight: '400' | '800' = '400';

                if (isSelected) {
                  dayBg = colors.primary;
                  textColor = '#FFFFFF';
                  fontWeight = '800';
                } else if (isToday) {
                  dayBg = colors.primary + '20';
                  fontWeight = '800';
                }

                return (
                  <TouchableOpacity 
                    key={di} 
                    onPress={() => setSelectedDateStr(cell.dateString)} 
                    style={{ 
                      flex: 1, 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: 38, 
                      backgroundColor: dayBg, 
                      borderRadius: 19,
                      position: 'relative'
                    }}
                  >
                    <Text style={{ color: textColor, fontWeight, fontSize: 14 }}>
                      {cell.day}
                    </Text>
                    {/* Stacked Event Dots Density Indicator */}
                    {dateEvents.length > 0 && !isSelected && (
                      <View style={{
                        position: 'absolute',
                        bottom: 3,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        {dateEvents.slice(0, 3).map((e, idx) => (
                          <View key={e.id || idx} style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: getEventColor(e.type)
                          }} />
                        ))}
                        {dateEvents.length > 3 && (
                          <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '900', lineHeight: 8, marginLeft: 1 }}>+</Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Upcoming Events Strip */}
        {upcomingEvents.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Upcoming Commitments</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {upcomingEvents.map(event => {
                const isExamOrDeadline = event.type === 'exam' || event.type === 'deadline';
                const countdown = isExamOrDeadline ? getCountdownText(event.date) : null;
                const isUrgent = countdown && (countdown.includes('Today') || countdown.includes('Tomorrow') || parseInt(countdown) <= 3);
                
                return (
                  <TouchableOpacity 
                    key={event.id}
                    onPress={() => {
                      setSelectedDateStr(event.date);
                      const eventDate = new Date(event.date);
                      setCurrentDate(eventDate);
                    }}
                    style={{ 
                      backgroundColor: colors.surface, 
                      borderRadius: 16, 
                      padding: 14, 
                      borderWidth: 1, 
                      borderColor: colors.border,
                      borderLeftWidth: 4,
                      borderLeftColor: getEventColor(event.type),
                      width: 200
                    }}
                  >
                    <Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 4 }}>{event.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 8 }}>{event.date}</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ backgroundColor: getEventColor(event.type) + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ color: getEventColor(event.type), fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>{event.type}</Text>
                      </View>
                      {countdown && (
                        <Text style={{ color: isUrgent ? '#EF4444' : colors.muted, fontSize: 9, fontWeight: '700' }}>
                          {countdown}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Selected Date GIMPA Academic Event Card */}
        {activeEvents.map(activeEvent => {
          const isExamOrDeadline = activeEvent.type === 'exam' || activeEvent.type === 'deadline';
          const countdown = isExamOrDeadline ? getCountdownText(activeEvent.date) : null;
          const isUrgent = countdown && (countdown.includes('Today') || countdown.includes('Tomorrow') || parseInt(countdown) <= 3);

          return (
            <View 
              key={activeEvent.id} 
              style={{ 
                marginHorizontal: 20, 
                backgroundColor: colors.surface, 
                borderRadius: 20, 
                padding: 18, 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderLeftWidth: 5,
                borderLeftColor: getEventColor(activeEvent.type),
                marginBottom: 16 
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                  <Ionicons 
                    name={activeEvent.type === 'exam' || activeEvent.type === 'deadline' ? "alert-circle" : "calendar"} 
                    size={20} 
                    color={getEventColor(activeEvent.type)} 
                    style={{ marginRight: 8 }} 
                  />
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                    {activeEvent.title}
                  </Text>
                </View>
                <View style={{ backgroundColor: getEventColor(activeEvent.type) + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: getEventColor(activeEvent.type), fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                    {activeEvent.type}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
                {activeEvent.description}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>
                  {activeEvent.date} {activeEvent.endDate !== activeEvent.date ? `to ${activeEvent.endDate}` : ''}
                </Text>
                {countdown && (
                  <Text style={{ color: isUrgent ? '#EF4444' : colors.muted, fontSize: 11, fontWeight: '800' }}>
                    {countdown}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {/* Heavy Week Wellness Nudge Banner */}
        {isHeavyWeek(selectedDateStr) && (
          <View style={{ 
            marginHorizontal: 20, 
            backgroundColor: '#EF444410', 
            borderRadius: 16, 
            padding: 16, 
            borderWidth: 1, 
            borderColor: '#EF444430',
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="warning-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }}>Heavy Week Alert</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 12, lineHeight: 18 }}>
                This looks like a heavy week. Your exercises page has tools to help you manage the pressure.
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Tabs', { screen: 'Exercises' })}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Go to Exercises</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Proactive Behavioural Nudge (Triggered near exam dates) */}
        {activeEvents.some(e => e.type === 'exam' || e.type === 'deadline') && (
          <View style={{ marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
            <View style={{ height: 130, backgroundColor: theme === 'dark' ? '#1C2742' : colors.primary + '15', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <MaterialCommunityIcons name="meditation" size={60} color={colors.primary} />
            </View>
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ backgroundColor: '#4ADE8022', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10 }}>
                  <Text style={{ color: '#4ADE80', fontSize: 11, fontWeight: '700' }}>PROACTIVE FLOW</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <Ionicons name="time-outline" size={14} color={colors.muted} style={{ marginRight: 4 }} />
                   <Text style={{ color: colors.muted, fontSize: 12 }}>4mins</Text>
                </View>
              </View>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
                Stress Prep: Box Breathing
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 18 }}>
                Your academic commitments are approaching. Ground your nervous system with a calming Box Breathing session before heading into study mode.
              </Text>
              <TouchableOpacity 
                onPress={handleBeginBreathing}
                style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Begin Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Daily Task List */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Today's Tasks</Text>
            <Text style={{ color: '#4ADE80', fontWeight: '700' }}>
              {tasks.filter(t => t.date === selectedDateStr && t.done).length}/{tasks.filter(t => t.date === selectedDateStr).length} Done
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16 }}>Focus on high-impact objectives</Text>
          
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : tasks.filter(t => t.date === selectedDateStr).length === 0 ? (
            <View style={{ 
              backgroundColor: colors.surface, borderRadius: 16, padding: 24, 
              alignItems: 'center', borderWidth: 1, borderColor: colors.border 
            }}>
              <Ionicons name="checkmark-circle-outline" size={32} color={colors.muted} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>No academic tasks for this date.</Text>
            </View>
          ) : (
            tasks.filter(t => t.date === selectedDateStr).map((t) => {
              const tagColor = t.tag === 'PRIORITY' ? '#F87171' : t.tag === 'DONE' ? '#4ADE80' : '#38BDF8';
              return (
                <View 
                  key={t.id} 
                  style={{ 
                    flexDirection: 'row', alignItems: 'flex-start', 
                    backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10, 
                    borderWidth: 1, borderColor: t.priority ? '#F8717144' : colors.border,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1,
                  }}
                >
                  <TouchableOpacity 
                    onPress={() => toggleTask(t.id)}
                    style={{ 
                      width: 22, height: 22, borderRadius: 11, borderWidth: 2, 
                      borderColor: t.done ? '#4ADE80' : t.priority ? '#F87171' : colors.border, 
                      backgroundColor: t.done ? '#4ADE8022' : 'transparent', 
                      alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 
                    }}
                  >
                    {t.done && <Ionicons name="checkmark" size={14} color="#4ADE80" />}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: t.done ? colors.muted : colors.text, 
                      fontWeight: '700', 
                      marginBottom: 2,
                      textDecorationLine: t.done ? 'line-through' : 'none'
                    }}>
                      {t.title}
                    </Text>
                    {t.sub ? <Text style={{ color: colors.muted, fontSize: 12 }}>{t.sub}</Text> : null}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: tagColor + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 }}>
                      <Text style={{ color: tagColor, fontSize: 10, fontWeight: '800' }}>{t.tag}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteTask(t.id)} style={{ marginLeft: 10 }}>
                      <Ionicons name="trash-outline" size={16} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Task / Reminder</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16 }}>Scheduled for {selectedDateStr}</Text>

            <Text style={[styles.inputLabel, { color: colors.muted }]}>TASK TITLE</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Study Chemistry Chapter 2"
              placeholderTextColor={colors.muted}
              value={taskTitle}
              onChangeText={setTaskTitle}
            />

            <Text style={[styles.inputLabel, { color: colors.muted }]}>SUB-DETAILS</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, height: 80, textAlignVertical: 'top' }]}
              placeholder="e.g. Solve end-of-chapter problems"
              placeholderTextColor={colors.muted}
              multiline
              value={taskSub}
              onChangeText={setTaskSub}
            />

            <Text style={[styles.inputLabel, { color: colors.muted }]}>PRIORITY TAG</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {(['ACADEMIC', 'PRIORITY'] as const).map(tag => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setTaskTag(tag)}
                  style={[
                    styles.tagButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    taskTag === tag && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                >
                  <Text style={{ color: taskTag === tag ? '#fff' : colors.text, fontWeight: '700', fontSize: 12 }}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.muted }]}>NOTIFICATION ALERT</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {[
                { value: 'none', label: 'None' },
                { value: '1h', label: '1 Hr Before' },
                { value: '2h', label: '2 Hrs Before' },
                { value: '1d', label: '1 Day Before' },
                { value: '2d', label: '2 Days Before' },
                { value: '7d', label: '1 Week Before' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setTaskAlert(opt.value as any)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: taskAlert === opt.value ? colors.primary : colors.border,
                    backgroundColor: taskAlert === opt.value ? colors.primary : colors.background,
                  }}
                >
                  <Text style={{ 
                    color: taskAlert === opt.value ? '#fff' : colors.text, 
                    fontWeight: '600', 
                    fontSize: 11 
                  }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddTask}
                style={[styles.modalSaveButton, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 20,
  },
  tagButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default CalendarScreen;
