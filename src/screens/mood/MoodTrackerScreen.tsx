import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MoodLogForm } from '../../components/forms/MoodLogForm';
import { useTheme } from '../../hooks/useTheme';

export const MoodTrackerScreen = () => {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: 56, paddingBottom: 100 }}
    >
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 6 }}>
          Daily Check-in
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          Take a moment to reflect on your wellbeing today.
        </Text>
      </View>
      <MoodLogForm onSuccess={() => {}} />
    </ScrollView>
  );
};

export default MoodTrackerScreen;
