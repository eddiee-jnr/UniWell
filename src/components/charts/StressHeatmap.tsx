import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { MoodEntry } from '../../types';

interface StressHeatmapProps {
  entries: MoodEntry[];
}

import { useTheme } from '../../hooks/useTheme';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const StressHeatmap: React.FC<StressHeatmapProps> = ({ entries }) => {
  const { colors, theme } = useTheme();

  // Map stress value 1-10 to a color
  const getStressColor = (stress: number | null): string => {
    if (stress === null) return theme === 'dark' ? '#1C2742' : '#E2E8F0';
    if (stress <= 3) return '#4ADE80';     // Low: green
    if (stress <= 5) return '#86EFAC';     // Mild: light green
    if (stress <= 7) return '#FBBF24';     // Moderate: amber
    return '#F87171';                       // High: red
  };

  const LEGEND = [
    { label: 'Low (1–3)',   color: '#4ADE80' },
    { label: 'Mild (4–5)',  color: '#86EFAC' },
    { label: 'High (6–7)', color: '#FBBF24' },
    { label: 'Peak (8+)',  color: '#F87171' },
  ];

  // Build a 28-day grid (4 weeks)
  const grid = useMemo(() => {
    const days: { date: Date; stress: number | null }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ date: d, stress: null });
    }
    entries.forEach((e) => {
      const entryDate = new Date(e.created_at);
      entryDate.setHours(0, 0, 0, 0);
      const slot = days.find((d) => d.date.getTime() === entryDate.getTime());
      if (slot) slot.stress = e.stress;
    });
    return days;
  }, [entries]);

  // Split into rows of 7
  const weeks: typeof grid[] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  return (
    <View>
      {/* Day labels */}
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {DAY_LETTERS.map((d, i) => (
          <Text key={i} style={{
            flex: 1, textAlign: 'center',
            color: colors.muted, fontSize: 10, fontWeight: '700',
          }}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row', marginBottom: 5 }}>
          {week.map((day, di) => (
            <View key={di} style={{ flex: 1, marginHorizontal: 2 }}>
              <View style={{
                height: 32, borderRadius: 6,
                backgroundColor: getStressColor(day.stress),
                opacity: day.stress === null ? (theme === 'dark' ? 0.3 : 1) : 1,
              }} />
            </View>
          ))}
        </View>
      ))}

      {/* Legend */}
      <View style={{
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'space-between', marginTop: 12,
      }}>
        {LEGEND.map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View style={{
              width: 12, height: 12, borderRadius: 3,
              backgroundColor: l.color, marginRight: 5,
            }} />
            <Text style={{ color: colors.muted, fontSize: 10 }}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default StressHeatmap;
