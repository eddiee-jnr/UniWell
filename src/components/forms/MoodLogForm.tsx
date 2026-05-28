import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ToastAndroid, Platform } from 'react-native';
import { useMoodStore } from '../../store/moodStore';
import { useAuthStore } from '../../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const MOODS = [
  { value: 1, icon: 'emoticon-sad-outline', label: 'Sad', color: '#F87171' },
  { value: 2, icon: 'emoticon-confused-outline', label: 'Meh', color: '#FB923C' },
  { icon: 'emoticon-neutral-outline', value: 3, label: 'Okay', color: '#FBBF24' },
  { value: 4, icon: 'emoticon-happy-outline', label: 'Good', color: '#4ADE80' },
  { value: 5, icon: 'emoticon-excited-outline', label: 'Great', color: '#A78BFA' },
];

export const MoodLogForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState(5);
  const [note, setNote] = useState('');
  
  const { colors } = useTheme();
  const addMoodEntry = useMoodStore((state) => state.addMoodEntry);
  const session = useAuthStore((state) => state.session);

  const handleSave = async () => {
    if (mood === null) return;
    
    try {
      await addMoodEntry({
        user_id: session?.user?.id || 'guest',
        mood: mood as any,
        stress,
        note,
      });
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Logged! Come back tomorrow to keep the momentum going.', ToastAndroid.LONG);
      } else {
        Alert.alert('Logged! ✨', 'Come back tomorrow to keep the momentum going.', [{ text: 'OK' }]);
      }
      
      onSuccess();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save check-in.');
    }
  };

  return (
    <View style={{ 
      backgroundColor: colors.surface, 
      borderRadius: 24, 
      padding: 24, 
      borderWidth: 1, 
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2
    }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 20 }}>How are you feeling?</Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
        {MOODS.map((m) => (
          <TouchableOpacity 
            key={m.value}
            onPress={() => setMood(m.value)}
            style={{ 
              padding: 12, 
              borderRadius: 16, 
              backgroundColor: mood === m.value ? m.color + '25' : colors.background,
              borderWidth: 1,
              borderColor: mood === m.value ? m.color : colors.border,
              alignItems: 'center',
              width: '18%'
            }}
          >
            <MaterialCommunityIcons 
              name={m.icon as any} 
              size={28} 
              color={mood === m.value ? m.color : colors.muted} 
              style={{ marginBottom: 4 }}
            />
            <Text style={{ 
              fontSize: 10, 
              fontWeight: '600', 
              color: mood === m.value ? m.color : colors.muted 
            }}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Stress Level</Text>
        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '800' }}>{stress}</Text>
      </View>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
          <TouchableOpacity 
            key={s}
            onPress={() => setStress(s)}
            style={{ 
              width: 38, 
              height: 38, 
              borderRadius: 19, 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: stress === s ? colors.primary : colors.background,
              borderWidth: 1,
              borderColor: stress === s ? colors.secondary : colors.border
            }}
          >
            <Text style={{ color: stress === s ? '#fff' : colors.text, fontWeight: '700', fontSize: 14 }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Notes</Text>
      <TextInput
        style={{ 
          backgroundColor: colors.background, 
          borderRadius: 16, 
          padding: 16, 
          color: colors.text, 
          marginBottom: 32, 
          height: 100, 
          textAlignVertical: 'top',
          borderWidth: 1,
          borderColor: colors.border
        }}
        multiline
        placeholder="What's on your mind?"
        placeholderTextColor={colors.muted}
        maxLength={150}
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity 
        disabled={mood === null}
        onPress={handleSave}
        style={{ 
          backgroundColor: mood !== null ? colors.primary : colors.border, 
          paddingVertical: 18, 
          borderRadius: 50,
          shadowColor: colors.primary,
          shadowOpacity: mood !== null ? 0.3 : 0,
          shadowRadius: 10,
          elevation: mood !== null ? 5 : 0
        }}
      >
        <Text style={{ color: mood !== null ? '#fff' : colors.muted, textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
          Save Check-in
        </Text>
      </TouchableOpacity>
    </View>
  );
};
