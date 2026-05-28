import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, Animated, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { saveDimensionRatingsLocally, getLatestDimensionRatings } from '../../services/storage';

const { width } = Dimensions.get('window');

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

export const WeeklyRefreshScreen = () => {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const totalSteps = TIER2_DIMENSIONS.length;
  const progress = new Animated.Value(step / totalSteps);

  const nextStep = () => {
    setStep(step + 1);
    Animated.timing(progress, {
      toValue: (step + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSelect = async (dimId: string, idx: number) => {
    const score = SCALE_SCORES[idx];
    const newAnswers = { ...answers, [dimId]: score };
    setAnswers(newAnswers);

    if (step + 1 === totalSteps) {
      await finishRefresh(newAnswers);
    } else {
      nextStep();
    }
  };

  const finishRefresh = async (finalAnswers: Record<string, number>) => {
    setIsCalculating(true);
    try {
      const userId = useAuthStore.getState().session?.user.id || 'guest';
      
      // Get previous ratings to keep Tier 1 dimensions unchanged
      const baseline = await getLatestDimensionRatings(userId);
      
      if (baseline) {
        await saveDimensionRatingsLocally({
          id: Math.random().toString(36).substring(2, 15),
          user_id: userId,
          physical: baseline.physical,
          emotional: baseline.emotional,
          social: baseline.social,
          intellectual: baseline.intellectual,
          occupational: baseline.occupational,
          spiritual: finalAnswers['spiritual'] || baseline.spiritual,
          environmental: finalAnswers['environmental'] || baseline.environmental,
          financial: finalAnswers['financial'] || baseline.financial,
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to save weekly refresh:', error);
    } finally {
      setTimeout(() => {
        setIsCalculating(false);
        navigation.navigate('Home');
      }, 1500);
    }
  };

  if (isCalculating) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.loaderCircle}>
          <Ionicons name="checkmark" size={50} color="#7C6FEB" />
        </View>
        <Text style={styles.loadingTitle}>Refresh Complete!</Text>
        <Text style={styles.loadingSub}>Updating your wellness radar chart...</Text>
      </View>
    );
  }

  const dim = TIER2_DIMENSIONS[step];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBar, { width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
          }) }]} />
        </View>
        <Text style={styles.stepText}>Refresh Step {step + 1} of {totalSteps}</Text>
      </View>

      <View style={styles.content}>
        {dim && (
          <View>
            <Text style={styles.categoryTitle}>{dim.title} Wellness</Text>
            <View style={styles.privateNoteContainer}>
              <Ionicons name="lock-closed" size={12} color="#A78BFA" />
              <Text style={styles.privateNote}>This is your private weekly check-in.</Text>
            </View>
            
            <Text style={styles.questionTextLarge}>{dim.q}</Text>
            
            <View style={styles.verticalOptionsContainer}>
              {SCALE_OPTIONS.map((opt, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.optionBtn}
                  onPress={() => handleSelect(dim.id, i)}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#7C6FEB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  header: { paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  progressBarBg: { height: 6, width: '100%', backgroundColor: '#1F2D45', borderRadius: 3, marginBottom: 12 },
  progressBar: { height: '100%', backgroundColor: '#7C6FEB' },
  stepText: { color: '#6B7A99', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 40 },
  categoryTitle: { color: '#A78BFA', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  questionTextLarge: { color: '#F0F4FF', fontSize: 28, fontWeight: '800', textAlign: 'center', lineHeight: 38, marginBottom: 40 },
  privateNoteContainer: { flexDirection: 'row', backgroundColor: '#A78BFA15', padding: 12, borderRadius: 12, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  privateNote: { color: '#A78BFA', fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },
  verticalOptionsContainer: { gap: 16 },
  optionBtn: { backgroundColor: '#111827', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1F2D45' },
  optionText: { color: '#F0F4FF', fontSize: 16, fontWeight: '600' },
  loaderCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#7C6FEB', marginBottom: 24 },
  loadingTitle: { color: '#F0F4FF', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  loadingSub: { color: '#6B7A99', fontSize: 14, textAlign: 'center' },
});

export default WeeklyRefreshScreen;
