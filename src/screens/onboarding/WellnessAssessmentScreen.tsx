import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, Animated, SafeAreaView, TextInput, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useMoodStore } from '../../store/moodStore';
import { saveDimensionRatingsLocally } from '../../services/storage';
import { syncPendingEntries } from '../../services/syncService';

const { width } = Dimensions.get('window');

const TIER1_DIMENSIONS = [
  {
    id: 'physical',
    title: 'Physical',
    qs: [
      'How many days this week did you engage in physical activity?',
      'How would you rate your sleep quality lately?'
    ]
  },
  {
    id: 'emotional',
    title: 'Emotional',
    qs: [
      'How well have you been managing stress recently?',
      'Do you feel able to express your emotions comfortably?'
    ]
  },
  {
    id: 'social',
    title: 'Social',
    qs: [
      'How connected do you feel to the people around you?',
      'Do you have people you can rely on when things get hard?'
    ]
  },
  {
    id: 'intellectual',
    title: 'Intellectual',
    qs: [
      'Are you engaging with ideas or learning outside of your required coursework?',
      'Do you feel mentally stimulated in your studies?'
    ]
  },
  {
    id: 'occupational',
    title: 'Occupational',
    qs: [
      'Do you find meaning or satisfaction in your role as a student?',
      'Do you feel your current efforts are moving you toward your goals?'
    ]
  }
];

const TIER2_DIMENSIONS = [
  {
    id: 'spiritual',
    title: 'Spiritual',
    q: 'How much sense of meaning or purpose do you feel in your life right now?'
  },
  {
    id: 'environmental',
    title: 'Environmental',
    q: 'How safe, comfortable, and supportive do you find your living and study spaces?'
  },
  {
    id: 'financial',
    title: 'Financial',
    q: 'How much in control of your financial situation do you feel currently?'
  }
];

const SCALE_OPTIONS = ['1 - Low', '2', '3 - Medium', '4', '5 - High'];
const SCALE_SCORES = [20, 40, 60, 80, 100];

const MOODS = [
  { value: 1, icon: 'emoticon-sad-outline', label: 'Sad', color: '#F87171' },
  { value: 2, icon: 'emoticon-confused-outline', label: 'Meh', color: '#FB923C' },
  { icon: 'emoticon-neutral-outline', value: 3, label: 'Okay', color: '#FBBF24' },
  { value: 4, icon: 'emoticon-happy-outline', label: 'Good', color: '#4ADE80' },
  { value: 5, icon: 'emoticon-excited-outline', label: 'Great', color: '#A78BFA' },
];

export const WellnessAssessmentScreen = () => {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(-1); // -1 is Welcome
  const [isCalculating, setIsCalculating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  
  // Daily check-in state
  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');

  // Local state for 2-question slides
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);

  const resetForm = () => {
    setStep(-1);
    setAnswers({});
    setMood(null);
    setStress(null);
    setNote('');
    setQ1(null);
    setQ2(null);
  };

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [])
  );

  const totalSteps = TIER1_DIMENSIONS.length + TIER2_DIMENSIONS.length + 3; // 5 + 3 + 3 check-ins
  const progress = new Animated.Value(Math.max(0, step) / totalSteps);

  const nextStep = () => {
    setStep(step + 1);
    setQ1(null);
    setQ2(null);
    Animated.timing(progress, {
      toValue: (step + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSelectTier1 = (idx: number, qNum: 1 | 2) => {
    if (qNum === 1) setQ1(idx);
    if (qNum === 2) setQ2(idx);
  };

  const submitTier1 = (dimId: string) => {
    if (q1 === null || q2 === null) return;
    const score = (SCALE_SCORES[q1] + SCALE_SCORES[q2]) / 2;
    setAnswers(prev => ({ ...prev, [dimId]: score }));
    nextStep();
  };

  const handleSelectTier2 = (dimId: string, idx: number) => {
    setAnswers(prev => ({ ...prev, [dimId]: SCALE_SCORES[idx] }));
    nextStep();
  };

  const handleSelectMood = (moodVal: number) => {
    setMood(moodVal);
    nextStep();
  };

  const handleSelectStress = (stressVal: number) => {
    setStress(stressVal);
    nextStep();
  };

  const startCalculation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      finishAssessment();
    }, 2500);
  };

  const finishAssessment = async () => {
    try {
      const userId = useAuthStore.getState().session?.user.id || 'guest';
      
      // Save the 8 dimensions baseline
      await saveDimensionRatingsLocally({
        id: Math.random().toString(36).substring(2, 15),
        user_id: userId,
        physical: answers['physical'] || 50,
        emotional: answers['emotional'] || 50,
        social: answers['social'] || 50,
        intellectual: answers['intellectual'] || 50,
        occupational: answers['occupational'] || 50,
        spiritual: answers['spiritual'] || 50,
        environmental: answers['environmental'] || 50,
        financial: answers['financial'] || 50,
        created_at: new Date().toISOString()
      });

      // Save initial mood check-in
      if (mood !== null && stress !== null) {
        const addMoodEntry = useMoodStore.getState().addMoodEntry;
        await addMoodEntry({
          user_id: userId,
          mood: mood as any,
          stress: stress,
          note: note || 'Initial Baseline Assessment',
        });
      }

      // Push both dimension ratings AND mood entry to Supabase immediately
      // so they are available for rehydration on the next login.
      if (userId !== 'guest') {
        await syncPendingEntries();
      }

      // Schedule daily wellness check-in reminder
      import('../../services/notificationService').then(({ scheduleWellnessCheckInReminder }) => {
        scheduleWellnessCheckInReminder().catch(console.error);
      });
    } catch (error) {
      console.error('Failed to save assessment:', error);
    } finally {
      navigation.navigate('Home');
    }
  };

  if (isCalculating) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.loaderCircle}>
          <Ionicons name="analytics" size={50} color="#7C6FEB" />
        </View>
        <Text style={styles.loadingTitle}>Calculating Results...</Text>
        <Text style={styles.loadingSub}>Analyzing your 8 dimensions of wellness...</Text>
      </View>
    );
  }

  // Welcome Screen
  if (step === -1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 30 }}>
          <View style={styles.iconBg}>
            <Ionicons name="compass-outline" size={48} color="#7C6FEB" />
          </View>
          <Text style={styles.welcomeTitle}>Welcome to UniWell</Text>
          <Text style={styles.welcomeDesc}>
            Before we set up your dashboard, let's take 2 minutes to understand where you are right now across eight areas of your life.
          </Text>
          <Text style={styles.welcomeNote}>There are no right or wrong answers.</Text>
          
          <TouchableOpacity onPress={nextStep} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Begin Assessment</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Determine current active slide
  const t1Len = TIER1_DIMENSIONS.length;
  const t2Len = TIER2_DIMENSIONS.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Header */}
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBar, { width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
          }) }]} />
        </View>
        <Text style={styles.stepText}>Step {step + 1} of {totalSteps}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Tier 1 Dimensions */}
        {step >= 0 && step < t1Len && (() => {
          const dim = TIER1_DIMENSIONS[step];
          return (
            <View>
              <Text style={styles.categoryTitle}>{dim.title} Wellness</Text>
              
              {/* Question 1 */}
              <Text style={styles.questionText}>{dim.qs[0]}</Text>
              <View style={styles.scaleContainer}>
                {SCALE_OPTIONS.map((opt, i) => (
                  <TouchableOpacity 
                    key={`q1-${i}`}
                    style={[styles.scaleNode, q1 === i && styles.scaleNodeActive]}
                    onPress={() => handleSelectTier1(i, 1)}
                  >
                    <Text style={[styles.scaleNodeText, q1 === i && styles.scaleNodeTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Question 2 */}
              <Text style={styles.questionText}>{dim.qs[1]}</Text>
              <View style={styles.scaleContainer}>
                {SCALE_OPTIONS.map((opt, i) => (
                  <TouchableOpacity 
                    key={`q2-${i}`}
                    style={[styles.scaleNode, q2 === i && styles.scaleNodeActive]}
                    onPress={() => handleSelectTier1(i, 2)}
                  >
                    <Text style={[styles.scaleNodeText, q2 === i && styles.scaleNodeTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                disabled={q1 === null || q2 === null}
                style={[styles.primaryBtn, { opacity: (q1 === null || q2 === null) ? 0.5 : 1 }]}
                onPress={() => submitTier1(dim.id)}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Tier 2 Dimensions */}
        {step >= t1Len && step < t1Len + t2Len && (() => {
          const dim = TIER2_DIMENSIONS[step - t1Len];
          return (
            <View>
              <Text style={styles.categoryTitle}>{dim.title} Wellness</Text>
              <View style={styles.privateNoteContainer}>
                <Ionicons name="lock-closed" size={12} color="#A78BFA" />
                <Text style={styles.privateNote}>This is just for your personal wellness picture — your answers are private and never shared.</Text>
              </View>
              
              <Text style={styles.questionTextLarge}>{dim.q}</Text>
              
              <View style={styles.verticalOptionsContainer}>
                {SCALE_OPTIONS.map((opt, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={styles.optionBtn}
                    onPress={() => handleSelectTier2(dim.id, i)}
                  >
                    <Text style={styles.optionText}>{opt}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#7C6FEB" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Mood Check-in */}
        {step === t1Len + t2Len && (
          <View>
            <Text style={styles.categoryTitle}>Daily Mood</Text>
            <Text style={styles.questionTextLarge}>How are you feeling right now?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              {MOODS.map((m) => (
                <TouchableOpacity 
                  key={m.value}
                  onPress={() => handleSelectMood(m.value)}
                  style={styles.moodBtn}
                >
                  <MaterialCommunityIcons name={m.icon as any} size={32} color={m.color} style={{ marginBottom: 6 }}/>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Stress Level */}
        {step === t1Len + t2Len + 1 && (
          <View>
            <Text style={styles.categoryTitle}>Current Stress</Text>
            <Text style={styles.questionTextLarge}>What is your current stress level?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                <TouchableOpacity 
                  key={s}
                  onPress={() => handleSelectStress(s)}
                  style={styles.stressBtn}
                >
                  <Text style={styles.stressBtnText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Reflection */}
        {step === t1Len + t2Len + 2 && (
          <View>
            <Text style={styles.categoryTitle}>Reflections</Text>
            <Text style={styles.questionTextLarge}>Any notes on your mind today?</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Write a brief reflection..."
              placeholderTextColor="#6B7A99"
              maxLength={150}
              value={note}
              onChangeText={setNote}
            />
            <TouchableOpacity onPress={startCalculation} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Finish Assessment</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  header: { paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  progressBarBg: { height: 6, width: '100%', backgroundColor: '#1F2D45', borderRadius: 3, marginBottom: 12 },
  progressBar: { height: '100%', backgroundColor: '#7C6FEB' },
  stepText: { color: '#6B7A99', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  content: { paddingHorizontal: 30, paddingTop: 40, paddingBottom: 60 },
  iconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1F2D45' },
  welcomeTitle: { color: '#F0F4FF', fontSize: 32, fontWeight: '800', marginBottom: 16 },
  welcomeDesc: { color: '#6B7A99', fontSize: 16, lineHeight: 24, marginBottom: 12 },
  welcomeNote: { color: '#A78BFA', fontSize: 14, fontWeight: '700', marginBottom: 40 },
  primaryBtn: { backgroundColor: '#7C6FEB', paddingVertical: 18, borderRadius: 50, shadowColor: '#7C6FEB', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, marginTop: 24 },
  primaryBtnText: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  categoryTitle: { color: '#A78BFA', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  questionText: { color: '#F0F4FF', fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26, marginBottom: 20 },
  questionTextLarge: { color: '#F0F4FF', fontSize: 28, fontWeight: '800', textAlign: 'center', lineHeight: 38, marginBottom: 40 },
  privateNoteContainer: { flexDirection: 'row', backgroundColor: '#A78BFA15', padding: 12, borderRadius: 12, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  privateNote: { color: '#A78BFA', fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },
  scaleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  scaleNode: { flex: 1, height: 45, marginHorizontal: 4, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2D45', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scaleNodeActive: { backgroundColor: '#7C6FEB', borderColor: '#A78BFA' },
  scaleNodeText: { color: '#6B7A99', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  scaleNodeTextActive: { color: '#FFF' },
  divider: { height: 1, backgroundColor: '#1F2D45', marginVertical: 30 },
  verticalOptionsContainer: { gap: 16 },
  optionBtn: { backgroundColor: '#111827', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1F2D45' },
  optionText: { color: '#F0F4FF', fontSize: 16, fontWeight: '600' },
  moodBtn: { padding: 14, borderRadius: 16, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2D45', alignItems: 'center', width: '18%' },
  moodLabel: { fontSize: 10, fontWeight: '700', color: '#6B7A99' },
  stressBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2D45' },
  stressBtnText: { color: '#F0F4FF', fontWeight: '800', fontSize: 16 },
  textInput: { backgroundColor: '#111827', borderRadius: 16, padding: 16, color: '#F0F4FF', height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#1F2D45', fontSize: 16, marginBottom: 20 },
  loaderCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#7C6FEB', marginBottom: 24 },
  loadingTitle: { color: '#F0F4FF', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  loadingSub: { color: '#6B7A99', fontSize: 14, textAlign: 'center' },
});

export default WellnessAssessmentScreen;
