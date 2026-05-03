import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { MoodEntry } from '../../types';

interface MoodLineChartProps {
  entries: MoodEntry[];
}

import { useTheme } from '../../hooks/useTheme';

const CHART_WIDTH  = Dimensions.get('window').width - 112;
const CHART_HEIGHT = 140;
const DAY_LABELS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MOOD_LABELS  = ['😔', '', '😐', '', '😄'];

export const MoodLineChart: React.FC<MoodLineChartProps> = ({ entries }) => {
  const { colors } = useTheme();
  // Build a 7-slot array, one per day going back from today
  const slots = useMemo(() => {
    const days: { label: string; value: number | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ label: DAY_LABELS[d.getDay()], value: null });
    }
    entries.forEach((e) => {
      const entryDate = new Date(e.created_at);
      entryDate.setHours(0, 0, 0, 0);
      const idx = 6 - Math.round((Date.now() - entryDate.getTime()) / 86400000);
      if (idx >= 0 && idx < 7) days[idx].value = e.mood;
    });
    return days;
  }, [entries]);

  const hasData = slots.some((s) => s.value !== null);

  if (!hasData) {
    return (
      <View style={{
        height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border, borderRadius: 14,
        borderStyle: 'dashed',
      }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>No check-ins in the last 7 days</Text>
        <Text style={{ color: colors.muted, opacity: 0.6, fontSize: 12, marginTop: 4 }}>Log a mood to see your trend</Text>
      </View>
    );
  }

  // Compute bar heights proportionally (mood 1-5 → 0-CHART_HEIGHT)
  const pointsWithValue = slots.map((s, i) => ({
    ...s,
    x: (i / 6) * CHART_WIDTH,
    y: s.value !== null
      ? CHART_HEIGHT - ((s.value - 1) / 4) * CHART_HEIGHT
      : null,
  }));

  // Draw connecting line segments between consecutive non-null points
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < pointsWithValue.length - 1; i++) {
    const cur = pointsWithValue[i];
    const nxt = pointsWithValue[i + 1];
    if (cur.y !== null && nxt.y !== null) {
      segments.push({ x1: cur.x, y1: cur.y, x2: nxt.x, y2: nxt.y });
    }
  }

  return (
    <View>
      {/* Y-axis labels */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 20, height: CHART_HEIGHT, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}>
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
              top: pct * CHART_HEIGHT,
              left: 0, right: 0,
              height: 1,
              backgroundColor: colors.border,
            }} />
          ))}

          {/* Line segments (drawn as rotated thin views) */}
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
                {/* Mood value tooltip */}
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

      {/* X-axis day labels */}
      <View style={{ flexDirection: 'row', marginLeft: 20, marginTop: 6 }}>
        {slots.map((s, i) => (
          <Text key={i} style={{
            flex: 1, textAlign: 'center',
            color: s.value !== null ? colors.secondary : colors.muted,
            fontSize: 10, fontWeight: s.value !== null ? '700' : '400',
          }}>{s.label}</Text>
        ))}
      </View>
    </View>
  );
};

export default MoodLineChart;
