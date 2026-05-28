import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle, G } from 'react-native-svg';
import { WellnessDimensions } from '../../hooks/useWellnessScore';
import { useTheme } from '../../hooks/useTheme';

interface RadarChartProps {
  dimensions: WellnessDimensions;
  size?: number;
}

const DIMENSION_KEYS: (keyof WellnessDimensions)[] = [
  'physical', 'emotional', 'social', 'intellectual', 
  'occupational', 'spiritual', 'environmental', 'financial'
];

const DIMENSION_LABELS = [
  'Physical', 'Emotional', 'Social', 'Intellectual', 
  'Occupational', 'Spiritual', 'Environ.', 'Financial'
];

export const RadarChart: React.FC<RadarChartProps> = ({ dimensions, size = Dimensions.get('window').width - 40 }) => {
  const { colors, theme } = useTheme();
  
  const padding = 40; // Extra space around the radar chart to prevent text clipping
  const svgSize = size + padding;
  const center = svgSize / 2;
  const radius = (size / 2) - 40; // Preserve the original visual radius
  const numAxes = 8;
  const angleStep = (Math.PI * 2) / numAxes;

  // Calculate coordinates for a given value (0-100) on a specific axis
  const getPoint = (value: number, index: number) => {
    const r = (value / 100) * radius;
    // Start at top (offset by -PI/2)
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Generate the polygon points string for the actual data
  const dataPoints = DIMENSION_KEYS.map((key, index) => {
    const value = dimensions[key] || 0;
    const { x, y } = getPoint(value, index);
    return `${x},${y}`;
  }).join(' ');

  // Generate the background web (concentric polygons)
  const levels = [20, 40, 60, 80, 100];

  return (
    <View style={[styles.container, { width: svgSize, height: svgSize }]}>
      <Svg width={svgSize} height={svgSize}>
        {/* Background Web Polygons */}
        {levels.map((level, i) => {
          const levelPoints = DIMENSION_KEYS.map((_, index) => {
            const { x, y } = getPoint(level, index);
            return `${x},${y}`;
          }).join(' ');
          
          return (
            <Polygon
              key={`web-${i}`}
              points={levelPoints}
              fill="none"
              stroke={colors.border}
              strokeWidth="1"
              strokeDasharray={i === levels.length - 1 ? "0" : "4,4"}
            />
          );
        })}

        {/* Axis Lines */}
        {DIMENSION_KEYS.map((_, index) => {
          const { x, y } = getPoint(100, index);
          return (
            <Line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={colors.border}
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <Polygon
          points={dataPoints}
          fill={colors.primary}
          fillOpacity="0.3"
          stroke={colors.primary}
          strokeWidth="2"
        />

        {/* Data Points */}
        {DIMENSION_KEYS.map((key, index) => {
          const value = dimensions[key] || 0;
          const { x, y } = getPoint(value, index);
          return (
            <Circle
              key={`dot-${index}`}
              cx={x}
              cy={y}
              r="4"
              fill={colors.primary}
              stroke={colors.background}
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        {DIMENSION_LABELS.map((label, index) => {
          // Push labels out slightly further than the 100% radius
          const { x, y } = getPoint(115, index);
          
          // Adjust text anchor based on side of the chart
          let textAnchor = 'middle';
          if (x < center - 10) textAnchor = 'end';
          if (x > center + 10) textAnchor = 'start';
          
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={y + 4} // Slight vertical offset for centering
              fill={colors.muted}
              fontSize="9"
              fontWeight="700"
              textAnchor={textAnchor as any}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});
