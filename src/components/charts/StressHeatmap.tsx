import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MoodEntry } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface StressHeatmapProps {
  entries: MoodEntry[];
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const StressHeatmap: React.FC<StressHeatmapProps> = ({ entries = [] }) => {
  const { colors, theme } = useTheme();
  const [range, setRange] = useState<'7days' | '30days' | 'all'>('30days'); // Default to 30 days for 4-week heatmap

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

  // Build a 28-day grid (4 weeks) aligned with Monday-Sunday columns
  const grid = useMemo(() => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // 0 is Monday, 1 is Tuesday... 6 is Sunday
    const startMonday = new Date();
    startMonday.setDate(today.getDate() - dayOfWeek - 21); // Monday of 3 weeks ago
    startMonday.setHours(0, 0, 0, 0);

    const days: { dateStr: string; stress: number | null }[] = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + i);
      days.push({ dateStr: d.toDateString(), stress: null });
    }

    // Filter entries based on the selected range
    const filtered = entries.filter((e) => {
      const entryTime = new Date(e.created_at).getTime();
      const diffTime = today.getTime() - entryTime;
      if (range === '7days') {
        return diffTime <= 7 * 24 * 60 * 60 * 1000;
      } else if (range === '30days') {
        return diffTime <= 30 * 24 * 60 * 60 * 1000;
      }
      return true; // All Time
    });

    filtered.forEach((e) => {
      const entryDate = new Date(e.created_at);
      const slot = days.find((d) => d.dateStr === entryDate.toDateString());
      if (slot) slot.stress = e.stress;
    });
    return days;
  }, [entries, range]);

  // Split into rows of 7
  const weeks: typeof grid[] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  const renderSelector = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
      {(['7days', '30days', 'all'] as const).map((r) => (
        <TouchableOpacity
          key={r}
          onPress={() => setRange(r)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: range === r ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: range === r ? colors.primary : colors.border
          }}
        >
          <Text style={{ 
            fontSize: 11, 
            fontWeight: '700', 
            color: range === r ? '#fff' : colors.muted 
          }}>
            {r === '7days' ? '7 Days' : r === '30days' ? '30 Days' : 'All Time'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View>
      {renderSelector()}

      {/* Day letters */}
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
