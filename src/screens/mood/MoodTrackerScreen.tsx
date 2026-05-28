import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useWellnessScore } from '../../hooks/useWellnessScore';
import { MoodLineChart } from '../../components/charts/MoodLineChart';
import { StressHeatmap } from '../../components/charts/StressHeatmap';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export const MoodTrackerScreen = () => {
  const { colors } = useTheme();
  const { 
    dimensions, 
    dimensions7Days, 
    dimensions30Days, 
    dimensionsAllTime, 
    last7Days, 
    allEntries, 
    avgStress, 
    hasBaseline 
  } = useWellnessScore();
  const [radarRange, setRadarRange] = React.useState<'7days' | '30days' | 'all'>('7days');

  const activeRadarDims = 
    radarRange === '7days' ? dimensions7Days : 
    radarRange === '30days' ? dimensions30Days : 
    dimensionsAllTime;

  // 1. Overall Score
  const overallScore = hasBaseline ? Math.round(
    (activeRadarDims.physical + activeRadarDims.emotional + activeRadarDims.social + activeRadarDims.intellectual + 
     activeRadarDims.occupational + activeRadarDims.spiritual + activeRadarDims.environmental + activeRadarDims.financial) / 8
  ) : 0;

  const getOverallInterpretation = () => {
    if (overallScore >= 66) return "Overall you are in a strong wellness position right now. Keep building on what is working.";
    if (overallScore >= 41) return "Your overall wellness is moderate. There are clear areas of strength and a few that need attention — your full report below will show you where to focus.";
    return "Your overall wellness score is low this period. Please do not ignore this. Small consistent actions can shift this significantly — and support is available on your Support page.";
  };

  // 2. Mood Interpretation
  const moodAvg = last7Days.length > 0 ? (last7Days.reduce((sum, e) => sum + e.mood, 0) / last7Days.length) : 0;
  const getMoodInterpretation = () => {
    if (moodAvg >= 4) return "Your mood has been mostly positive this week. You appear to be managing your emotional load well.";
    if (moodAvg >= 2) return "Your mood has been variable this week. Some days were harder than others — this is completely normal under academic pressure.";
    return "Your mood has been consistently low this week. This is worth paying attention to. We strongly encourage you to visit the campus support directory or speak to someone you trust.";
  };

  // 3. Stress Interpretation
  const getStressInterpretation = () => {
    if (avgStress >= 7) return "Your stress peaked recently. This may have coincided with academic deadlines or exams. Recognising your stress patterns helps you prepare better next time.";
    return "Your stress has been well-managed recently. Keep maintaining the habits that are working for you.";
  };

  // 4. Dimensions Definitions & Interpretations
  const getDimensionData = (key: string, score: number) => {
    const data: Record<string, { definition: string; low: string; mod: string; high: string }> = {
      Physical: {
        definition: "Recognising the need for and engaging in physical activity, eating nourishing foods, and getting adequate sleep and rest.",
        low: `Your physical wellness is lower than ideal (${score}%). This suggests foundational habits around sleep or activity are slipping. Try adding one short walk or stretch to your daily routine this week.`,
        mod: `You are about halfway on your physical wellness (${score}%). This suggests some healthy habits are in place but there is room to improve — particularly around sleep or physical activity. Try completing one physical exercise this week.`,
        high: `Your physical wellness is strong (${score}%). You are maintaining excellent foundational habits which support your academic resilience.`
      },
      Emotional: {
        definition: "Developing skills and strategies to cope with stress. Being able to express feelings effectively.",
        low: `Your emotional wellness is low (${score}%). You may be feeling overwhelmed or unable to process recent stressors. Please be gentle with yourself and consider speaking to a campus counselor.`,
        mod: `Your emotional wellness is moderate (${score}%). You are coping, but the pressure might be building. A short breathing exercise today could help reset your focus.`,
        high: `Your emotional wellness is strong (${score}%). You are demonstrating excellent emotional regulation and coping strategies.`
      },
      Social: {
        definition: "Developing a sense of connection, belonging, and a well-developed support system.",
        low: `Your social wellness is very low (${score}%). Academic pressure can often lead to isolation. Try reaching out to just one friend or family member today.`,
        mod: `Your social wellness is moderate (${score}%). You have some support, but could benefit from deeper connections. Consider joining a campus club or study group.`,
        high: `Your social wellness is a key strength (${score}%). You have a solid support system that acts as a buffer against academic stress.`
      },
      Intellectual: {
        definition: "Recognising creative abilities and finding ways to expand knowledge and skills.",
        low: `Your intellectual wellness is lower than ideal (${score}%). This could mean you are feeling understimulated or overwhelmed by coursework rather than genuinely engaged. Try exploring one topic this week purely out of curiosity.`,
        mod: `Your intellectual wellness is moderate (${score}%). You are keeping up with academic demands, but may lack creative stimulation. Try learning something completely unrelated to your degree today.`,
        high: `Your intellectual wellness is strong (${score}%). You are genuinely engaging with your academic journey and finding mental stimulation rewarding.`
      },
      Occupational: {
        definition: "Personal satisfaction and enrichment from one's work, including academic pursuits and career planning.",
        low: `Your occupational wellness is low (${score}%). You may be feeling disconnected from your academic goals or worried about your career path.`,
        mod: `Your occupational wellness is moderate (${score}%). You are making steady progress but might benefit from clearer short-term goals. Check off one small academic task today.`,
        high: `Your occupational wellness is strong (${score}%). You feel purposeful and satisfied with your academic and career trajectory.`
      },
      Spiritual: {
        definition: "Developing a sense of meaning, purpose, balance, and peace in your life.",
        low: `Your spiritual wellness is low (${score}%). You may be feeling a lack of purpose or disconnect from your values. Taking 10 minutes to journal might help ground you.`,
        mod: `Your spiritual wellness is moderate (${score}%). You have some sense of balance but it might be wavering under pressure. Try spending a few moments in quiet reflection.`,
        high: `Your spiritual wellness is strong (${score}%). You have a deep sense of meaning and purpose that guides you through difficulties.`
      },
      Environmental: {
        definition: "Good health by occupying pleasant, stimulating environments that support well-being.",
        low: `Your environmental wellness is low (${score}%). A cluttered or unsafe space can amplify stress. Try organizing your immediate study desk for 5 minutes.`,
        mod: `Your environmental wellness is moderate (${score}%). Your spaces are functional but perhaps not deeply comforting. Adding some natural light or plants might help.`,
        high: `Your environmental wellness is excellent (${score}%). Your living and study environments actively support your peace of mind.`
      },
      Financial: {
        definition: "Satisfaction with current and future financial situations.",
        low: `Your financial wellness is low (${score}%). Financial stress is a major burden. We recommend visiting the campus financial aid office for guidance and support options.`,
        mod: `Your financial wellness is moderate (${score}%). You are managing, but may feel tight. Budgeting a small weekly allowance for treats could help you feel more in control.`,
        high: `Your financial wellness is strong (${score}%). You appear to feel in control of your current situation, which removes a significant source of student stress.`
      }
    };
    
    const d = data[key];
    if (!d) return { definition: '', interpretation: '' };
    let interpretation = d.low;
    if (score >= 66) interpretation = d.high;
    else if (score >= 41) interpretation = d.mod;
    return { definition: d.definition, interpretation };
  };

  const dimsList = [
    { name: 'Physical', value: activeRadarDims.physical, color: colors.dimPhysical },
    { name: 'Emotional', value: activeRadarDims.emotional, color: colors.dimEmotional },
    { name: 'Social', value: activeRadarDims.social, color: colors.dimSocial },
    { name: 'Intellectual', value: activeRadarDims.intellectual, color: colors.dimIntellectual },
    { name: 'Occupational', value: activeRadarDims.occupational, color: colors.dimOccupational },
    { name: 'Spiritual', value: activeRadarDims.spiritual, color: colors.dimSpiritual },
    { name: 'Environmental', value: activeRadarDims.environmental, color: colors.dimEnvironmental },
    { name: 'Financial', value: activeRadarDims.financial, color: colors.dimFinancial },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 56, marginBottom: 24 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 6 }}>
          Track & Report
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          Your comprehensive analytical wellness report.
        </Text>
      </View>

      {!hasBaseline ? (
        <View style={{ marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
            Take your baseline assessment to unlock your analytical report.
          </Text>
        </View>
      ) : (
        <>
          {/* Section 1: Overall Wellness Score */}
          <View style={{ marginHorizontal: 20, marginBottom: 32, alignItems: 'center' }}>
            <View style={{ width: 140, height: 140, marginBottom: 16 }}>
              <Svg width="140" height="140">
                <Circle cx="70" cy="70" r="60" stroke={colors.border} strokeWidth="12" fill="none" />
                <Circle 
                  cx="70" cy="70" r="60" 
                  stroke={colors.primary} 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray={`${(overallScore / 100) * 377} 377`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
                <SvgText x="70" y="78" fill={colors.text} fontSize="28" fontWeight="800" textAnchor="middle">
                  {overallScore}%
                </SvgText>
              </Svg>
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
              Overall Wellness
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
              {getOverallInterpretation()}
            </Text>
          </View>

          {/* Section 2: Mood Report */}
          <View style={{ marginHorizontal: 20, marginBottom: 32 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Mood Report</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
              <MoodLineChart entries={allEntries} />
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
                  {getMoodInterpretation()}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 3: Stress Report */}
          <View style={{ marginHorizontal: 20, marginBottom: 32 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Stress Report</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
              <StressHeatmap entries={allEntries} />
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
                  {getStressInterpretation()}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 4: Eight Dimensions Breakdown */}
          <View style={{ marginHorizontal: 20, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Dimensions Breakdown</Text>
              <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.surface, padding: 3, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                {(['7days', '30days', 'all'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRadarRange(r)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: radarRange === r ? colors.primary : 'transparent',
                    }}
                  >
                    <Text style={{ 
                      fontSize: 10, 
                      fontWeight: '700', 
                      color: radarRange === r ? '#fff' : colors.muted 
                    }}>
                      {r === '7days' ? '7D' : r === '30days' ? '30D' : 'All'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {dimsList.map((dim) => {
              const { definition, interpretation } = getDimensionData(dim.name, dim.value);
              return (
                <View key={dim.name} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dim.color, marginRight: 10 }} />
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{dim.name}</Text>
                    </View>
                    <Text style={{ color: dim.color, fontSize: 18, fontWeight: '800' }}>{dim.value}%</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 13, fontStyle: 'italic', marginBottom: 12, lineHeight: 18 }}>
                    {definition}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
                    {interpretation}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Section 5: Check-in History Feed */}
          <View style={{ marginHorizontal: 20, marginBottom: 32 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Check-in History Feed</Text>
            {allEntries.length === 0 ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>No historical check-ins found.</Text>
              </View>
            ) : (
              allEntries.map((e) => (
                <View 
                  key={e.id} 
                  style={{ 
                    backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, 
                    borderWidth: 1, borderColor: colors.border 
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
                      {new Date(e.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>
                          Mood: {e.mood === 5 ? '😄' : e.mood === 4 ? '😊' : e.mood === 3 ? '😐' : e.mood === 2 ? '😔' : '😭'} {e.mood}/5
                        </Text>
                      </View>
                      <View style={{ backgroundColor: '#F8717115', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '800' }}>
                          Stress: {e.stress}/10
                        </Text>
                      </View>
                    </View>
                  </View>
                  {e.note ? (
                    <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18, fontStyle: 'italic' }}>
                      "{e.note}"
                    </Text>
                  ) : (
                    <Text style={{ color: colors.muted, fontSize: 12, fontStyle: 'italic' }}>
                      No notes logged for this check-in.
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default MoodTrackerScreen;
