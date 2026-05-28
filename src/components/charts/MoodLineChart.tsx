import React, { useMemo, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { MoodEntry } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface MoodLineChartProps {
  entries: MoodEntry[];
}

const CHART_WIDTH  = Dimensions.get('window').width - 112;
const CHART_HEIGHT = 140;

export const MoodLineChart: React.FC<MoodLineChartProps> = ({ entries = [] }) => {
  const { colors } = useTheme();
  const [range, setRange] = useState<'7days' | '30days' | 'all'>('7days');

  // Build the slots based on the selected range
  const slots = useMemo(() => {
    if (range === '7days') {
      const days: { label: string; value: number | null; dateStr: string }[] = [];
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      const today = new Date();
      const currentDay = today.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysSinceMonday);

      for (let i = 0; i < 7; i++) {
        const slotDate = new Date(monday);
        slotDate.setDate(monday.getDate() + i);
        days.push({ label: weekdays[i], value: null, dateStr: slotDate.toDateString() });
      }
      entries.forEach((e) => {
        const entryDate = new Date(e.created_at);
        const slot = days.find(d => d.dateStr === entryDate.toDateString());
        if (slot) slot.value = e.mood;
      });
      return days;
    } else if (range === '30days') {
      const days: { label: string; value: number | null; dateStr: string }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Only show date label for every 6th day to avoid crowding
        const label = i % 6 === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : '';
        days.push({ label, value: null, dateStr: d.toDateString() });
      }
      entries.forEach((e) => {
        const entryDate = new Date(e.created_at);
        const slot = days.find(d => d.dateStr === entryDate.toDateString());
        if (slot) slot.value = e.mood;
      });
      return days;
    } else {
      // All Time: plot all logged dates chronologically
      const sorted = [...entries]
        .filter(e => e.created_at)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const grouped: { label: string; value: number; dateStr: string }[] = [];
      sorted.forEach(e => {
        const d = new Date(e.created_at);
        const dateStr = d.toDateString();
        // Keep the latest entry for a single date
        const existingIdx = grouped.findIndex(g => g.dateStr === dateStr);
        if (existingIdx !== -1) {
          grouped[existingIdx].value = e.mood;
        } else {
          grouped.push({
            dateStr,
            label: `${d.getDate()}/${d.getMonth() + 1}`,
            value: e.mood
          });
        }
      });
      return grouped;
    }
  }, [entries, range]);

  const hasData = slots.some((s) => s.value !== null);

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

  if (!hasData) {
    return (
      <View>
        {renderSelector()}
        <View style={{
          height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: colors.border, borderRadius: 14,
          borderStyle: 'dashed', marginTop: 8
        }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>No check-ins found for this period</Text>
        </View>
      </View>
    );
  }

  // Compute point coordinates with padding
  const pointsWithValue = slots.map((s, i) => {
    const padding = 12;
    const denominator = slots.length > 1 ? slots.length - 1 : 1;
    return {
      ...s,
      x: padding + (i / denominator) * (CHART_WIDTH - padding * 2),
      y: s.value !== null
        ? CHART_HEIGHT - ((s.value - 1) / 4) * (CHART_HEIGHT - 20) - 10
        : null,
    };
  });

  // Draw connecting line segments between consecutive non-null points
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let lastPoint: typeof pointsWithValue[0] | null = null;
  for (let i = 0; i < pointsWithValue.length; i++) {
    const cur = pointsWithValue[i];
    if (cur.y !== null) {
      if (lastPoint !== null && lastPoint.y !== null) {
        segments.push({ x1: lastPoint.x, y1: lastPoint.y, x2: cur.x, y2: cur.y });
      }
      lastPoint = cur;
    }
  }

  return (
    <View>
      {renderSelector()}

      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis labels */}
        <View style={{ width: 20, height: CHART_HEIGHT, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
          {[5, 4, 3, 2, 1].map((n) => (
            <Text key={n} style={{ color: colors.muted, fontSize: 9, fontWeight: '700' }}>{n}</Text>
          ))}
        </View>

        {/* Chart area */}
        <View style={{ flex: 1, height: CHART_HEIGHT, position: 'relative' }}>
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <View key={pct} style={{
              position: 'absolute',
              top: 10 + pct * (CHART_HEIGHT - 20),
              left: 0, right: 0,
              height: 1,
              backgroundColor: colors.border,
            }} />
          ))}

          {/* Line segments */}
          {segments.map((seg, i) => {
            const dx = seg.x2 - seg.x1;
            const dy = seg.y2 - seg.y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View key={i} style={{
                position: 'absolute',
                left: seg.x1,
                top: seg.y1,
                width: len,
                height: 2.5,
                backgroundColor: colors.primary,
                borderRadius: 2,
                transformOrigin: '0 50%',
                transform: [{ rotate: `${angle}deg` }],
              }} />
            );
          })}

          {/* Data points */}
          {pointsWithValue.map((p, i) =>
            p.y !== null ? (
              <View key={i} style={{
                position: 'absolute',
                left: p.x - 6,
                top: p.y - 6,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.secondary,
                borderWidth: 2,
                borderColor: colors.surface,
              }}>
                <Text style={{
                  position: 'absolute',
                  top: -18,
                  left: -4,
                  color: colors.secondary,
                  fontSize: 10,
                  fontWeight: '800',
                }}>{p.value}</Text>
              </View>
            ) : null
          )}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={{ height: 20, marginLeft: 20, marginTop: 6, position: 'relative' }}>
        {pointsWithValue.map((p, i) => 
          p.label ? (
            <Text key={i} style={{
              position: 'absolute',
              left: p.x - 20,
              width: 40,
              textAlign: 'center',
              color: p.value !== null ? colors.secondary : colors.muted,
              fontSize: 8, 
              fontWeight: p.value !== null ? '700' : '400',
            }}>{p.label}</Text>
          ) : null
        )}
      </View>
    </View>
  );
};

export default MoodLineChart;
